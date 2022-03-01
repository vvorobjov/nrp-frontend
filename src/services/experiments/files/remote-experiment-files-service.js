import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';
import getMimeByExtension from '../../../utility/mime-type';
import DialogService from '../../dialog-service';
import browserName from '../../../utility/browser-name';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const LOCALSTORAGE_KEY_FILE_INFO = 'NRP-remote-experiment-files_local-files';
const FS_TYPE_FILE = 'file';
const FS_TYPE_DIRECTORY = 'directory';
const SERVER_FILE_TYPE_DIRECTORY = 'folder';

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

  notifyNotSupported() {
    if (!this.isSupported()){
      DialogService.instance.warning({
        message : 'The remote experiment file system is not supported on ' + browserName()
      });
    }
  }

  toggleAutoSync() {
    this.autoSync = !this.autoSync;
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();

    if (this.localSyncDirectoryHandle) {
      this.initLocalFileInfoFromLocalStorage();
      await this.updateFileLists();
    }

    this.intervalCheckLocalFiles = setInterval(async () => {
      await this.updateFileLists();
    }, RemoteExperimentFilesService.CONSTANTS.INTERVAL_UPDATE_FILES);
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
    let updatedFilePaths = [];

    await this.traverseFilesystem(this.localSyncDirectoryHandle,
      async (fileSystemHandle) => {
        let fileRelativePath = await this.getRelativePathFromFSHandle(fileSystemHandle);
        let file = await this.getOrCreateLocalFile(fileRelativePath, fileSystemHandle.kind, fileSystemHandle);
        file && updatedFilePaths.push(file.relativePath);
      }
    );

    // get rid of map entries that have been deleted in FS
    for (let entry of this.mapLocalFiles) {
      const relativePath = entry[0];
      if (!updatedFilePaths.includes(relativePath)) {
        this.mapLocalFiles.delete(relativePath);
      }
    }
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

  async getOrCreateLocalFile(relativePath, type, fileSystemHandle = undefined) {
    if (!relativePath || relativePath.length === 0) {
      return;
    }

    let fileName = this.getFileNameFromRelativePath(relativePath);
    if (fileName.charAt(0) === '.' || fileName.includes('.crswap')) {
      return;
    }

    this.getOrCreateFileInfo(relativePath, type);
    let localFile = this.mapLocalFiles.get(relativePath);
    if (!localFile) {
      localFile = {
        name: fileName,
        relativePath: relativePath,
        fileSystemHandle: fileSystemHandle
      };
      this.mapLocalFiles.set(relativePath, localFile);
    }

    localFile.fileSystemHandle = localFile.fileSystemHandle || fileSystemHandle;
    if (!localFile.fileSystemHandle) {
      let parentDirectory = undefined;
      let lastIndexSlash = relativePath.lastIndexOf('/');
      if (lastIndexSlash && lastIndexSlash !== -1) {
        let parentDirectoryPath = this.getParentDirectoryFromRelativePath(relativePath);
        parentDirectory = await this.getOrCreateLocalFile(parentDirectoryPath, FS_TYPE_DIRECTORY);
      }
      let parentDirectoryHandle = parentDirectory ? parentDirectory.fileSystemHandle : this.localSyncDirectoryHandle;

      if (type === FS_TYPE_FILE) {
        localFile.fileSystemHandle = await parentDirectoryHandle.getFileHandle(fileName, {create: true});
      }
      else if (type === FS_TYPE_DIRECTORY) {
        localFile.fileSystemHandle = await parentDirectoryHandle.getDirectoryHandle(fileName, {create: true});
      }
    }

    return localFile;
  }

  async updateServerFiles(forceUpdate = false) {
    let newServerFilesMap = new Map();

    let getServerDirectoryFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      for (let serverFile of serverFileList) {
        newServerFilesMap.set(serverFile.uuid, serverFile);
        if (!this.mapLocalFiles.has(serverFile.uuid)) {
          this.getOrCreateFileInfo(serverFile.uuid, serverFile.type);
        }

        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === SERVER_FILE_TYPE_DIRECTORY) {
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
    for (let keyValueEntry of this.mapFileInfos) {
      const relativePath = keyValueEntry[0];
      let fileInfo = keyValueEntry[1];
      const localFile = this.mapLocalFiles.get(relativePath);
      const serverFile = this.mapServerFiles.get(relativePath);

      if (!localFile) {
        if (!serverFile) {
          // local file has been deleted and is not present on server, remove from list
          this.removeFileInfo(relativePath);
        }
        else {
          // local file has been deleted, but is part of the experiment files on server
          if (this.autoSync && fileInfo.type === FS_TYPE_FILE) {
            await this.downloadExperimentFile(relativePath);
          }
        }
      }

      if (localFile && localFile.fileSystemHandle && localFile.fileSystemHandle.kind === FS_TYPE_FILE) {
        fileInfo.hasLocalChanges = await this.hasLocalChanges(relativePath);
        fileInfo.isOutOfSync = this.isOutOfSync(relativePath);
        fileInfo.localOnly = !this.mapServerFiles.has(relativePath);
        fileInfo.serverOnly = !this.mapLocalFiles.has(relativePath);

        if (this.autoSync) {
          if (fileInfo.hasLocalChanges || fileInfo.localOnly) {
            await this.uploadExperimentFile(relativePath);
          }

          if (fileInfo.isOutOfSync) {
            await this.downloadExperimentFile(relativePath);
          }
        }
      }
    }
  }

  getOrCreateFileInfo(relativePath, type) {
    let fileName = this.getFileNameFromRelativePath(relativePath);
    if (fileName.charAt(0) === '.' || fileName.includes('.crswap')) {
      return;
    }

    let fileInfo = this.mapFileInfos.get(relativePath);
    if (!fileInfo) {
      fileInfo = {};
      this.mapFileInfos.set(relativePath, fileInfo);
    }
    fileInfo.name = fileInfo.name || fileName;
    fileInfo.type = fileInfo.type || type;
    fileInfo.relativePath = fileInfo.relativePath || relativePath;

    let parentDirectoryPath = this.getParentDirectoryFromRelativePath(relativePath);
    let parentDirectory = this.mapFileInfos.get(parentDirectoryPath);
    if (!parentDirectory && parentDirectoryPath.length > 0) {
      parentDirectory = this.getOrCreateFileInfo(parentDirectoryPath, FS_TYPE_DIRECTORY);
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

  initLocalFileInfoFromLocalStorage() {
    this.mapFileInfos = new Map(JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_FILE_INFO)));
  }

  saveLocalFileInfoToLocalStorage() {
    let mapStorage = new Map();
    for (let keyValuePair of this.mapFileInfos) {
      let relativePath = keyValuePair[0];
      let file = keyValuePair[1];
      mapStorage.set(relativePath, {
        name: file.name,
        relativePath: file.relativePath,
        type: file.type,
        dateSync: file.dateSync
      });
    }

    localStorage.setItem(LOCALSTORAGE_KEY_FILE_INFO, JSON.stringify(Array.from(mapStorage.entries())));
  }

  async hasLocalChanges(relativePath) {
    let fileInfo = this.mapFileInfos.get(relativePath);
    let localFile = this.mapLocalFiles.get(relativePath);
    if (!localFile || !localFile.fileSystemHandle || !fileInfo || !fileInfo.dateSync) {
      return undefined;
    }
    return (fileInfo.dateSync < (await localFile.fileSystemHandle.getFile()).lastModified);
  }

  isOutOfSync(relativePath) {
    let fileInfo = this.mapFileInfos.get(relativePath);
    let serverFile = this.mapServerFiles.get(relativePath);
    return serverFile && fileInfo.dateSync && Date.parse(serverFile.modifiedOn) > fileInfo.dateSync;
  }

  async downloadExperimentFile(relativeFilepath) {
    let localFile = await this.getOrCreateLocalFile(relativeFilepath, FS_TYPE_FILE);
    let fileInfo = this.mapFileInfos.get(relativeFilepath);

    let parentDirectoryPath = this.getParentDirectoryFromRelativePath(relativeFilepath);
    let fileContent = await ExperimentStorageService.instance.getBlob(parentDirectoryPath, relativeFilepath, false);
    let writable = await localFile.fileSystemHandle.createWritable();
    await writable.write(fileContent);
    await writable.close();
    fileInfo.dateSync = (await localFile.fileSystemHandle.getFile()).lastModified;
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

    let experimentRootDirectory = await this.getOrCreateLocalFile(experiment.id, FS_TYPE_DIRECTORY);
    if (!experimentRootDirectory) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;

      for (let serverFile of serverFileList) {
        serverFile.parent = parentDirectory;
        if (serverFile.type === FS_TYPE_FILE) {
          await this.downloadExperimentFile(serverFile.uuid);
        }
        else if (serverFile.type === SERVER_FILE_TYPE_DIRECTORY) {
          await this.getOrCreateLocalFile(serverFile.uuid, FS_TYPE_DIRECTORY);
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

  async uploadExperimentFile(relativePath) {
    let localFile = this.mapLocalFiles.get(relativePath);
    let fileInfo = this.mapFileInfos.get(relativePath);
    if (this.isOutOfSync(relativePath)) {
      //TODO: error GUI
      console.warn('WARNING! ' + fileInfo.name + ' has a newer version on the server, won\'t upload');
      fileInfo.msgError = 'Won\'t upload - file version on server is newer!';
    }
    else {
      let fileHandle = localFile && localFile.fileSystemHandle;
      if (!fileHandle) {
        console.warn('Could not upload ' + relativePath + ' - missing file handle.');
        return;
      }

      let localFileData = await fileHandle.getFile();
      let fileExtension = fileInfo.name.substring(fileHandle.name.lastIndexOf('.') + 1);
      let contentType = getMimeByExtension(fileExtension);

      let parentDirectoryPath = this.getParentDirectoryFromRelativePath(relativePath);
      let response = await ExperimentStorageService.instance.setFile(
        parentDirectoryPath, fileHandle.name, localFileData, true, contentType);
      if (response.status === 200) {
        fileInfo.dateSync = Date.now().valueOf();
      }
    }
  }

  async uploadExperimentFileList(fileList) {
    for (const filepath of fileList) {
      await this.uploadExperimentFile(filepath);
    }
  }

  uploadExperimentFromLocalFS(experiment) {
    let uploadFolder = async (folder) => {
      for (let file of folder.children) {
        /*let localFile = this.mapLocalFiles.get(file.relativePath);
        if (localFile && localFile.fileSystemHandle && localFile.fileSystemHandle.kind === FS_TYPE_FILE) {
          await this.uploadExperimentFile(this.getRelativePathFromFSHandle(localFile.fileSystemHandle));
        }
        else if (localFile && localFile.fileSystemHandle && localFile.type === FS_TYPE_DIRECTORY) {
          uploadFolder(file);
        }*/
        if (file.type === FS_TYPE_FILE) {
          await this.uploadExperimentFile(file.relativePath);
        }
        else if (file.type === FS_TYPE_DIRECTORY) {
          uploadFolder(file);
        }
      }
    };

    let localExperimentFiles = this.mapFileInfos.get(experiment.uuid);
    uploadFolder(localExperimentFiles);
  }

  deleteExperimentFile(relativePath) {
    let experimentName = this.getExperimentNameFromRelativePath(relativePath);
    let serverFile = this.mapServerFiles.get(relativePath);
    ExperimentStorageService.instance.deleteEntity(experimentName, relativePath, true, serverFile.type);
  }

  deleteExperimentFileList(fileList) {
    for (const relativePath of fileList) {
      this.deleteExperimentFile(relativePath);
    }
  }

  getExperimentNameFromRelativePath(relativePath) {
    return relativePath.substring(0, relativePath.indexOf('/'));
  }

  getFileNameFromRelativePath(relativePath) {
    return relativePath.substring(relativePath.lastIndexOf('/') + 1);
  }

  getParentDirectoryFromRelativePath(relativePath) {
    return relativePath.substring(0, relativePath.lastIndexOf('/'));
  }

  async getRelativePathFromFSHandle(fileSystemHandle) {
    let filePathArray = await this.localSyncDirectoryHandle.resolve(fileSystemHandle);
    let fileRelativePath = filePathArray.join('/');

    return fileRelativePath;
  }
}

RemoteExperimentFilesService.CONSTANTS = Object.freeze({
  INTERVAL_UPDATE_FILES: 1000
});

export default RemoteExperimentFilesService;
