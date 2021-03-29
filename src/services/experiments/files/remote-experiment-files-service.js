import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';
import getMimeByExtension from '../../../utility/mime-type';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const LOCALSTORAGE_KEY_FILE_INFO = 'NRP-remote-experiment-files_local-files';
const FS_TYPE_FILE = 'file';
const FS_TYPE_FOLDER = 'folder';

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
    this.serverFiles = new Map();
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
      await this.updateFileLists();
    }, RemoteExperimentFilesService.CONSTANTS.INTERVAL_CHECK_LOCAL_FILES);
  }

  async updateFileLists() {
    if (!this.localSyncDirectoryHandle) {
      return;
    }

    await this.updateServerFiles();

    await this.updateLocalFiles();

    this.saveLocalFileInfoToLocalStorage();
  }

  async updateLocalFiles() {
    //let fileMap = new Map();

    await this.traverseLocalFiles(this.localSyncDirectoryHandle,
      async (fileSystemHandle, fileRelativePath) => {
        let file = this.localFiles.get(fileRelativePath)
          || await this.addLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle, this.localFiles);

        if (file && file.fileSystemHandle && file.fileSystemHandle.kind === FS_TYPE_FILE) {
          file.hasLocalChanges = await this.hasLocalChanges(file);
          file.isOutOfSync = this.isOutOfSync(file);
          file.localOnly = !this.hasServerFile(file.relativePath);

          if (this.autoSync) {
            if (file.hasLocalChanges || file.localOnly) {
              this.uploadExperimentFile(file);
            }

            if (file.isOutOfSync) {
              this.downloadExperimentFile(file.relativePath);
            }
          }
        }
      }
    );

    //this.localFiles = fileMap;
  }

  async updateServerFiles(forceUpdate = false) {
    let newServerFilesMap = new Map();
    let getServerDirectoryFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;
      serverFileList.forEach(async (serverFile) => {
        newServerFilesMap.set(serverFile.uuid, serverFile);
        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === FS_TYPE_FOLDER) {
            await getServerDirectoryFiles(serverFile);
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
      await getServerDirectoryFiles(serverExperiment);

      this.serverFiles.set(experiment.id, serverExperiment);
    });

    this.serverFiles = newServerFilesMap;
  }

  /**
   *
   * @param {*} directoryHandle
   * @param {*} callbackFile - callback function called with (fileRelativePath, fileSystemHandle)
   * @param {*} fileMap
   * @returns
   */
  async traverseLocalFiles(directoryHandle, callbackFile) {
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

        callbackFile && await callbackFile(fileSystemHandle, fileRelativePath);

        if (fileSystemHandle.kind === 'directory') {
          await traverseFolder(await directoryHandle.getDirectoryHandle(fileSystemHandle.name), fileRelativePath);
        }

        result = await iterator.next();
      }
    };
    await traverseFolder(directoryHandle, '');
  }

  async addLocalFile(relativePath, type, fileSystemHandle = undefined, fileMap = undefined) {
    let mapForFiles = fileMap ? fileMap : this.localFiles;
    if (mapForFiles.has(relativePath)) {
      //console.warn('RemoteExperimentFilesService.addLocalFile() - file ' + relativePath + ' already exists.');
      return;
    }
    let fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
    if (fileName.includes('.crswap')) {
      return;
    }

    let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
    let parentDirectory = mapForFiles.get(parentDirectoryPath);
    let parentDirectoryHandle = parentDirectory ? parentDirectory.fileSystemHandle : this.localSyncDirectoryHandle;
    if (!fileSystemHandle) {
      if (type === FS_TYPE_FILE) {
        fileSystemHandle = await parentDirectoryHandle.getFileHandle(fileName, {create: true});
      }
      else if (type === FS_TYPE_FOLDER) {
        fileSystemHandle = await parentDirectoryHandle.getDirectoryHandle(fileName, {create: true});
      }
    }

    let localFile = {
      fileSystemHandle: fileSystemHandle,
      relativePath: relativePath,
      parent: parentDirectory
    };
    mapForFiles.set(relativePath, localFile);
    if (parentDirectory) {
      parentDirectory.children = parentDirectory.children || [];
      parentDirectory.children.push(localFile);
    }

    return localFile;
  }

  toggleAutoSync() {
    this.autoSync = !this.autoSync;
  }

  traverseServerFiles(serverDirectory, callbackFile) {
    let traverseFolder = (serverFolder) => {
      serverFolder.children.forEach(child => {
        if (child.type === FS_TYPE_FILE) {
          callbackFile(child);
        }
        else if (child.type === FS_TYPE_FOLDER) {
          traverseFolder(child);
        }
      });
    };
    traverseFolder(serverDirectory);
  }

  initLocalFileInfoFromLocalStorage() {
    let localFileInfo = localStorage.getItem(LOCALSTORAGE_KEY_FILE_INFO);
    let mapFileInfo = new Map(JSON.parse(localFileInfo));

    //let fileMap = new Map();
    this.traverseLocalFiles(
      this.localSyncDirectoryHandle,
      async (fileSystemHandle, fileRelativePath) => {
        let file = this.localFiles.get(fileRelativePath)
          || await this.addLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle, this.localFiles);

        let fileInfo = mapFileInfo.get(file.relativePath);
        if (fileInfo) {
          Object.assign(file, fileInfo);
        }
      }
    );

    //this.localFiles = fileMap;
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

  getServerFileByRelativePath(filepath) {
    let splitPath = filepath.split('/');
    let experimentID = splitPath[0];
    splitPath.splice(0, 1);
    let serverExperiment = this.serverFiles.get(experimentID);
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
    let hasExperiment = this.serverFiles.has(experimentID);
    let hasFile = this.serverFiles.get(relativeFilepath) !== undefined;

    return (hasExperiment && hasFile);
  }

  isOutOfSync(localFile) {
    let serverFile = this.serverFiles.get(localFile.relativePath);
    return serverFile && localFile.dateSync && Date.parse(serverFile.modifiedOn) > localFile.dateSync;
  }

  async downloadExperimentFile(relativeFilepath) {
    let localFile = this.localFiles.get(relativeFilepath) || await this.addLocalFile(relativeFilepath, FS_TYPE_FILE);

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
      || await this.addLocalFile(experiment.id, FS_TYPE_FOLDER);
    if (!experimentRootDirectory) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      serverFileList.forEach(async (serverFile) => {
        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === FS_TYPE_FILE) {
            await this.downloadExperimentFile(serverFile.uuid);
          }
          else if (serverFile.type === FS_TYPE_FOLDER) {
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

    this.serverFiles.set(experiment.id, serverExperiment);
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
        if (file.fileSystemHandle.kind === FS_TYPE_FILE) {
          await this.uploadExperimentFile(file);
        }
        else if (file.type === FS_TYPE_FOLDER) {
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
