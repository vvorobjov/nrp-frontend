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
    this.mapLocalFiles = new Map();
    this.mapServerFiles = new Map();
    this.mapFileInfos = new Map();
    //this.localFileInfo = undefined;
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

    await this.updateFileInfos();

    this.saveLocalFileInfoToLocalStorage();
  }

  async updateLocalFiles() {
    let updatedFilepaths = [];

    await this.traverseFilesystem(this.localSyncDirectoryHandle,
      async (fileSystemHandle) => {
        let fileRelativePath = await this.getRelativePathFromFSHandle(fileSystemHandle);
        updatedFilepaths.push(fileRelativePath);

        let file = await this.getOrCreateLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle);

        if (file && file.fileSystemHandle && file.fileSystemHandle.kind === FS_TYPE_FILE) {
          file.hasLocalChanges = await this.hasLocalChanges(file);
          file.isOutOfSync = this.isOutOfSync(file);
          file.localOnly = !this.hasServerFile(file.relativePath);

          if (this.autoSync) {
            if (file.hasLocalChanges || file.localOnly) {
              await this.uploadExperimentFile(file);
            }

            if (file.isOutOfSync) {
              console.info('updateLocalFiles - downloadExperimentFile():');
              console.info(file);
              await this.downloadExperimentFile(file.relativePath);
            }
          }
        }
      }
    );

    for (let keyValueEntry of this.mapLocalFiles) {
      let file = keyValueEntry[1];
      if (!updatedFilepaths.includes(file.relativePath)) {
        if (!this.mapServerFiles.has(file.relativePath)) {
          // local file has been deleted and is not present on server, remove from list
          this.removeFileInfo(file.relativePath);
        }
        else {
          // local file has been deleted, but is part of the experiment files on server
          //delete file.fileSystemHandle;
          if (this.autoSync && file.type === FS_TYPE_FILE) {
            await this.downloadExperimentFile(file.relativePath);
          }
        }
      }
    }
  }

  async updateServerFiles(forceUpdate = false) {
    let newServerFilesMap = new Map();

    let getServerDirectoryFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      for (let serverFile of serverFileList) {
        newServerFilesMap.set(serverFile.uuid, serverFile);
        if (!this.mapLocalFiles.has(serverFile.uuid)) {
          this.addOrCreateFileInfo(serverFile.uuid, serverFile.type);
        }

        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === FS_TYPE_FOLDER) {
            await getServerDirectoryFiles(serverFile);
          }
        }
        catch (error) {
          console.error(error);
        }
      }
    };

    let experiments = await ExperimentStorageService.instance.getExperiments(forceUpdate);
    for (let experiment of experiments) {
      let serverExperiment = {
        uuid: experiment.uuid,
        name: experiment.configuration.name
      };
      await getServerDirectoryFiles(serverExperiment);

      newServerFilesMap.set(experiment.uuid, serverExperiment);
    }

    this.mapServerFiles = newServerFilesMap;
  }

  async updateFileInfos() {

  }

  /**
   *
   * @param {*} directoryHandle
   * @param {*} callbackFile - callback function called with (fileRelativePath, fileSystemHandle)
   * @returns
   */
  async traverseFilesystem(directoryHandle, callbackFile) {
    if (!directoryHandle) {
      return;
    }

    let traverseFolder = async (directoryHandle) => {
      let iterator = directoryHandle.values();
      let result = await iterator.next();
      while (!result.done) {
        let fileSystemHandle = result.value;

        callbackFile && await callbackFile(fileSystemHandle);

        if (fileSystemHandle.kind === 'directory') {
          await traverseFolder(fileSystemHandle);
        }

        result = await iterator.next();
      }
    };
    await traverseFolder(directoryHandle);
  }

  async getRelativePathFromFSHandle(fileSystemHandle) {
    let filePathArray = await this.localSyncDirectoryHandle.resolve(fileSystemHandle);
    let fileRelativePath = filePathArray.join('/');

    return fileRelativePath;
  }

  addOrCreateFileInfo(relativePath, type) {
    let fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
    if (fileName.charAt(0) === '.' || fileName.includes('.crswap')) {
      return;
    }
    //console.info('addFile: ' + relativePath + ' - ' + type); // not the problem

    let fileInfo = this.mapFileInfos.get(relativePath);
    if (!fileInfo) {
      fileInfo = {
        name: fileName,
        type: type,
        relativePath: relativePath
      };
      this.mapLocalFiles.set(relativePath, fileInfo);
    }

    let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
    let parentDirectory = this.mapFileInfos.get(parentDirectoryPath);
    if (!parentDirectory && parentDirectoryPath.length > 0) {
      parentDirectory = this.addOrCreateFileInfo(parentDirectoryPath, FS_TYPE_FOLDER);
    }
    if (parentDirectory) {
      fileInfo.parent = parentDirectory;
      parentDirectory.children = parentDirectory.children || [];
      if (!parentDirectory.children.includes(fileInfo)) {
        parentDirectory.children.push(fileInfo);
      }
    }

    return fileInfo;
  }

  removeFileInfo(relativePath) {
    let file = this.mapFileInfos.get(relativePath);
    if (!file) {
      return;
    }

    if (file.parent) {
      file.parent.children = file.parent.children.filter(child => child.relativePath !== relativePath);
    }

    this.mapFileInfos.delete(relativePath);
  }

  async getOrCreateLocalFile(relativePath, type, fileSystemHandle = undefined) {
    if (!relativePath || relativePath.length === 0) {
      return;
    }

    let fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
    if (fileName.charAt(0) === '.' || fileName.includes('.crswap')) {
      return;
    }

    let fileInfo = this.addOrCreateFileInfo(relativePath, type);
    let localFile = this.mapLocalFiles.get(relativePath);

    localFile.fileSystemHandle = fileInfo.fileSystemHandle || fileSystemHandle;
    if (!fileInfo.fileSystemHandle) {
      let parentDirectory = undefined;
      let lastIndexSlash = relativePath.lastIndexOf('/');
      if (lastIndexSlash && lastIndexSlash !== -1) {
        let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
        parentDirectory = await this.getOrCreateLocalFile(parentDirectoryPath, FS_TYPE_FOLDER);
      }
      let parentDirectoryHandle = parentDirectory ? parentDirectory.fileSystemHandle : this.localSyncDirectoryHandle;
      //console.info('getOrCreateLocalFile: ' + relativePath + ' - ' + type + ', parentDirectoryHandle:');
      //console.info(parentDirectoryHandle);

      if (type === FS_TYPE_FILE) {
        fileInfo.fileSystemHandle = await parentDirectoryHandle.getFileHandle(fileName, {create: true});
      }
      else if (type === FS_TYPE_FOLDER) {
        fileInfo.fileSystemHandle = await parentDirectoryHandle.getDirectoryHandle(fileName, {create: true});
      }
    }

    return fileInfo;
  }

  toggleAutoSync() {
    this.autoSync = !this.autoSync;
  }

  /*traverseServerFiles(serverDirectory, callbackFile) {
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
  }*/

  initLocalFileInfoFromLocalStorage() {
    this.mapFileInfos = new Map(JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_FILE_INFO)));

    //let fileMap = new Map();
    /*this.traverseFilesystem(
      this.localSyncDirectoryHandle,
      async (fileSystemHandle) => {
        let fileRelativePath = await this.getRelativePathFromFSHandle(fileSystemHandle);
        let file = await this.getOrCreateLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle);

        let fileInfo = file && this.localFileInfo.get(file.relativePath);
        if (fileInfo) {
          Object.assign(file, fileInfo);
        }
      }
    );*/
  }

  saveLocalFileInfoToLocalStorage() {
    /*for (let keyValuePair of this.mapLocalFiles) {
      let relativePath = keyValuePair[0];
      let file = keyValuePair[1];
      this.localFileInfo.set(relativePath, {
        dateSync: file.dateSync
      });
    }*/

    localStorage.setItem(LOCALSTORAGE_KEY_FILE_INFO, JSON.stringify(Array.from(this.mapFileInfos.entries())));
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
    let hasExperiment = this.mapServerFiles.has(experimentID);
    let hasFile = this.mapServerFiles.get(relativeFilepath) !== undefined;

    return (hasExperiment && hasFile);
  }

  isOutOfSync(localFile) {
    let serverFile = this.mapServerFiles.get(localFile.relativePath);
    return serverFile && localFile.dateSync && Date.parse(serverFile.modifiedOn) > localFile.dateSync;
  }

  async downloadExperimentFile(relativeFilepath) {
    console.info('downloadExperimentFile: ' + relativeFilepath);
    let localFile = await this.getOrCreateLocalFile(relativeFilepath, FS_TYPE_FILE);
    console.info(localFile);

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

    let experimentRootDirectory = await this.getOrCreateLocalFile(experiment.id, FS_TYPE_FOLDER);
    if (!experimentRootDirectory) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      for (let serverFile of serverFileList) {
        serverFile.parent = parentDirectory;
        if (serverFile.type === FS_TYPE_FILE) {
          console.info('before downloadExperimentFile: ' + serverFile.name);
          console.info(serverFile);
          await this.downloadExperimentFile(serverFile.uuid);
        }
        else if (serverFile.type === FS_TYPE_FOLDER) {
          await this.getOrCreateLocalFile(serverFile.uuid, serverFile.type);
          await downloadFiles(serverFile);
        }
      }
    };

    let serverExperiment = {
      uuid: experiment.uuid,
      name: experiment.configuration.name
    };
    await downloadFiles(serverExperiment);

    this.mapServerFiles.set(experiment.id, serverExperiment);
  }

  async uploadExperimentFile(localFile) {
    if (this.isOutOfSync(localFile)) {
      //TODO: error GUI
      console.warn('WARNING! ' + localFile.name + ' has a newer version on the server, won\'t upload');
      localFile.dirtyOnServer = true;
      localFile.msgError = 'Won\'t upload - file version on server is newer!';
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
      let localFile = this.mapLocalFiles.get(filepath);
      localFile && await this.uploadExperimentFile(localFile);
    }
  }

  uploadExperimentFromLocalFS(experiment) {
    let uploadFolder = async (folder) => {
      for (let file of folder.children) {
        if (file.fileSystemHandle.kind === FS_TYPE_FILE) {
          await this.uploadExperimentFile(file);
        }
        else if (file.type === FS_TYPE_FOLDER) {
          uploadFolder(file);
        }
      }
    };

    let localExperimentFiles = this.mapLocalFiles.get(experiment.uuid);
    uploadFolder(localExperimentFiles);
  }
}

RemoteExperimentFilesService.CONSTANTS = Object.freeze({
  INTERVAL_CHECK_LOCAL_FILES: 1000
});

export default RemoteExperimentFilesService;
