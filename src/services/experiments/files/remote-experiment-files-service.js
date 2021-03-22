import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';
import getMimeByExtension from '../../../utility/mime-type';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const LOCALSTORAGE_KEY_FILE_INFO = 'NRP-remote-experiment-files_local-files';

/**
 * Provides functionality to mirror (up-/download) and manage experiment files locally.
 */
class RemoteExperimentFilesService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.localSyncDirectoryHandle = undefined;
    this.localFiles = new Map();
    this.serverExperiments = new Map();
    this.autoSync = false;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new RemoteExperimentFilesService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  isSupported() {
    return window.showDirectoryPicker !== undefined && window.showDirectoryPicker !== null;
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();

    if (this.localSyncDirectoryHandle) {
      await this.updateServerFiles();
      this.initLocalFileInfoFromLocalStorage();
    }

    this.intervalCheckLocalFiles = setInterval(async () => {
      if (!this.localSyncDirectoryHandle) {
        return;
      }

      await this.updateServerFiles();

      this.traverseLocalFiles(this.localSyncDirectoryHandle,
        async (file) => {
          if (file && file.fileSystemHandle && file.fileSystemHandle.kind === 'file') {
            file.hasLocalChanges = await this.hasLocalChanges(file);
            file.untracked = !this.hasServerFile(file.relativePath);
            file.isOutOfSync = this.isOutOfSync(file);

            if (this.autoSync) {
              if (file.hasLocalChanges || file.untracked) {
                this.uploadExperimentFile(file);
              }

              if (file.isOutOfSync) {
                this.downloadExperimentFile(file.relativePath);
              }
            }
          }
        }
      );

      this.saveLocalFileInfoToLocalStorage();
    }, RemoteExperimentFilesService.CONSTANTS.INTERVAL_CHECK_LOCAL_FILES);
  }

  toggleAutoSync() {
    this.autoSync = !this.autoSync;
  }

  async addLocalFile(relativePath, type, fileSystemHandle) {
    if (this.localFiles.has(relativePath)) {
      //console.warn('RemoteExperimentFilesService.addLocalFile() - file ' + relativePath + ' already exists.');
      return;
    }
    let fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
    if (fileName.includes('.crswap')) {
      return;
    }

    let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
    let parentDirectory = this.localFiles.get(parentDirectoryPath);
    let parentDirectoryHandle = parentDirectory ? parentDirectory.fileSystemHandle : this.localSyncDirectoryHandle;
    if (!fileSystemHandle) {
      if (type === 'file') {
        fileSystemHandle = await parentDirectoryHandle.getFileHandle(fileName, {create: true});
      }
      else if (type === 'folder') {
        fileSystemHandle = await parentDirectoryHandle.getDirectoryHandle(fileName, {create: true});
      }
    }

    let localFile = {
      fileSystemHandle: fileSystemHandle,
      relativePath: relativePath,
      parent: parentDirectory
    };
    this.localFiles.set(relativePath, localFile);
    if (parentDirectory) {
      parentDirectory.children = parentDirectory.children || [];
      parentDirectory.children.push(localFile);
    }

    return localFile;
  }

  traverseLocalFiles(directoryHandle, callbackFunction, relativePath = '') {
    if (!directoryHandle) {
      return;
    }

    let traverseFolder = async (directoryHandle, parentDirectoryPath) => {
      let iterator = directoryHandle.values();
      let result = await iterator.next();
      while (!result.done) {
        let fileSystemHandle = result.value;
        let fileRelativePath = parentDirectoryPath;
        fileRelativePath += parentDirectoryPath.length > 0 ? '/' : '';
        fileRelativePath += fileSystemHandle.name;
        let localFile = this.localFiles.get(fileRelativePath)
          || await this.addLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle);

        callbackFunction && await callbackFunction(localFile);

        if (fileSystemHandle.kind === 'directory') {
          await traverseFolder(await directoryHandle.getDirectoryHandle(fileSystemHandle.name), fileRelativePath);
        }

        result = await iterator.next();
      }
    };
    traverseFolder(directoryHandle, relativePath);
  }

  initLocalFileInfoFromLocalStorage() {
    let localFileInfo = localStorage.getItem(LOCALSTORAGE_KEY_FILE_INFO);
    let mapFileInfo = new Map(JSON.parse(localFileInfo));

    this.traverseLocalFiles(
      this.localSyncDirectoryHandle,
      (file) => {
        let fileInfo = mapFileInfo.get(file.relativePath);
        if (fileInfo) {
          Object.assign(file, fileInfo);
        }
      }
    );
  }

  saveLocalFileInfoToLocalStorage() {
    let mapFileInfo = new Map();
    this.localFiles.forEach((value, key) => {
      mapFileInfo.set(key, {
        dateSync: value.dateSync
      });
    });

    localStorage.setItem(LOCALSTORAGE_KEY_FILE_INFO, JSON.stringify(Array.from(mapFileInfo.entries())));
  }

  async updateServerFiles(forceUpdate = false) {
    let getDirectoryFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;
      serverFileList.forEach(async (serverFile) => {
        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === 'folder') {
            await getDirectoryFiles(serverFile);
          }
        }
        catch (error) {
          console.error(error);
        }
      });
    };

    let experiments = await ExperimentStorageService.instance.getExperiments(forceUpdate);
    experiments.forEach(async (experiment) => {
      let serverExperiment = {
        uuid: experiment.uuid,
        name: experiment.configuration.name
      };
      await getDirectoryFiles(serverExperiment);

      this.serverExperiments.set(experiment.id, serverExperiment);
    });
  }

  getServerFileByRelativePath(filepath) {
    let splitPath = filepath.split('/');
    let experimentID = splitPath[0];
    splitPath.splice(0, 1);
    let serverExperiment = this.serverExperiments.get(experimentID);
    if (!serverExperiment) {
      return;
    }

    if (splitPath.length === 0) {
      return serverExperiment;
    }

    let currentFilesInFolder = serverExperiment.children;
    let file = undefined;
    while (currentFilesInFolder && splitPath.length > 0) {
      file = currentFilesInFolder.find(element => element.name === splitPath[0]);
      currentFilesInFolder = file && file.children;
      splitPath.splice(0, 1);
    }

    return file;
  }

  async hasLocalChanges(localFile) {
    if (!localFile || !localFile.fileSystemHandle || !localFile.dateSync) {
      return undefined;
    }
    return (localFile.dateSync < (await localFile.fileSystemHandle.getFile()).lastModified);
  }

  hasServerFile(relativeFilepath) {
    let splitPath = relativeFilepath.split('/');
    let experimentID = splitPath[0];
    let hasExperiment = this.serverExperiments.has(experimentID);
    let hasFile = this.getServerFileByRelativePath(relativeFilepath) !== undefined;

    return (hasExperiment && hasFile);
  }

  isOutOfSync(localFile) {
    let serverFile = this.getServerFileByRelativePath(localFile.relativePath);
    return serverFile && localFile.dateSync && Date.parse(serverFile.modifiedOn) > localFile.dateSync;
  }

  async downloadExperimentFile(relativeFilepath) {
    let localFile = this.localFiles.get(relativeFilepath) || await this.addLocalFile(relativeFilepath, 'file');

    let parentDirectoryPath = relativeFilepath.substring(0, relativeFilepath.lastIndexOf('/'));
    let fileContent = await ExperimentStorageService.instance.getBlob(parentDirectoryPath, relativeFilepath, false);
    let writable = await localFile.fileSystemHandle.createWritable();
    await writable.write(fileContent);
    await writable.close();
    localFile.dateSync = (await localFile.fileSystemHandle.getFile()).lastModified;
  }

  async downloadExperimentFileList(fileList) {
    for (const filepath of fileList) {
      await this.downloadExperimentFile(filepath);
    }
  }

  async downloadExperimentToLocalFS(experiment) {
    if (!this.localSyncDirectoryHandle) {
      return;
    }

    let experimentRootDirectory = this.localFiles.get(experiment.uuid)
      || await this.addLocalFile(experiment.id, 'folder');
    if (!experimentRootDirectory) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      serverFileList.forEach(async (serverFile) => {
        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === 'file') {
            await this.downloadExperimentFile(serverFile.uuid);
          }
          else if (serverFile.type === 'folder') {
            await this.addLocalFile(serverFile.uuid, serverFile.type);
            downloadFiles(serverFile);
          }
        }
        catch (error) {
          console.error(error);
        }
      });
    };

    let serverExperiment = {
      uuid: experiment.uuid,
      name: experiment.configuration.name
    };
    downloadFiles(serverExperiment);

    this.serverExperiments.set(experiment.id, serverExperiment);
  }

  async uploadExperimentFile(localFile) {
    if (this.isOutOfSync(localFile)) {
      //TODO: error GUI
      console.warn('WARNING! ' + localFile.name + ' has a newer version on the server, won\'t upload');
      localFile.dirtyOnServer = true;
      localFile.msgError = 'File version on server is newer! Will not upload.';
    }
    else {
      let fileHandle = localFile.fileSystemHandle;
      if (!fileHandle) {
        console.warn('Could not upload ' + localFile.relativePath + ' - missing file handle.');
        return;
      }

      let localFileData = await fileHandle.getFile();
      let fileExtension = fileHandle.name.substring(fileHandle.name.lastIndexOf('.') + 1);
      let contentType = getMimeByExtension(fileExtension);

      let parentDirectoryPath = localFile.relativePath.substring(0, localFile.relativePath.lastIndexOf('/'));
      let response = await ExperimentStorageService.instance.setFile(
        parentDirectoryPath, fileHandle.name, localFileData, true, contentType);
      if (response.status === 200) {
        localFile.dateSync = Date.now().valueOf();
      }
    }
  }

  async uploadExperimentFileList(fileList) {
    for (const filepath of fileList) {
      let localFile = this.localFiles.get(filepath);
      localFile && await this.uploadExperimentFile(localFile);
    }
  }

  uploadExperimentFromLocalFS(experiment) {
    let uploadFolder = async (folder) => {
      folder.children.forEach(async file => {
        if (file.fileSystemHandle.kind === 'file') {
          await this.uploadExperimentFile(file);
        }
        else if (file.type === 'folder') {
          uploadFolder(file);
        }
      });
    };

    let localExperimentFiles = this.localFiles.get(experiment.uuid);
    uploadFolder(localExperimentFiles);
  }
}

RemoteExperimentFilesService.CONSTANTS = Object.freeze({
  INTERVAL_CHECK_LOCAL_FILES: 1000
});

export default RemoteExperimentFilesService;
