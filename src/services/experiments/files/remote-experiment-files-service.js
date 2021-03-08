import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';
import getMimeByExtension from '../../../utility/mime-type';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * TODO
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

    this.intervalCheckLocalFiles = setInterval(async () => {
      this.localSyncDirectoryHandle && this.traverseLocalFiles(this.localSyncDirectoryHandle,
        async (fileSystemHandle, parentDirecotryPath) => {
          let fileRelativePath = parentDirecotryPath;
          fileRelativePath += parentDirecotryPath.length > 0 ? '/' : '';
          fileRelativePath += fileSystemHandle.name;
          /*if (parentDirecotryPath === '') {
            fileRelativePath += fileSystemHandle.name;
          }
          else {
            fileRelativePath += '/' + fileSystemHandle.name;
          }*/

          let localFile = this.localFiles.get(fileRelativePath);
          if (!localFile) {
            localFile = await this.addLocalFile(fileRelativePath, fileSystemHandle);
          }

          if (localFile.fileSystemHandle.kind === 'file') {
            localFile.hasLocalChanges = await this.hasLocalChanges(localFile);
            /*if (localFile.fileSystemHandle.name === 'experiment_configuration.exc') {
              console.info(localFile);
            }*/
          }
        }
      );
    }, RemoteExperimentFilesService.CONSTANTS.INTERVAL_CHECK_LOCAL_FILES);
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

  toggleAutoSync() {
    this.autoSync = !this.autoSync;
  }

  async addLocalFile(relativePath, fileSystemHandle) {
    if (this.localFiles.has(relativePath)) {
      console.warn('RemoteExperimentFilesService.addLocalFile() - file ' + relativePath + ' already exists.');
      return;
    }
    let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
    let fileName = relativePath.substring(relativePath.lastIndexOf('/'));
    let parentDirectory = this.localFiles.get(parentDirectoryPath);
    if (!fileSystemHandle) {
      if (fileName.includes('.')) {
        fileSystemHandle = await parentDirectory.fileSystemHandle.getFileHandle(fileName, {create: true});
      }
      else {
        fileSystemHandle = await parentDirectory.fileSystemHandle.getDirectoryHandle(fileName, {create: true});
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

  traverseLocalFiles(directoryHandle, cbFileSystemHandle, relativePath = '') {
    if (!directoryHandle) {
      return;
    }

    let traverseFolder = async (directoryHandle, parentDirectoryPath) => {
      let iterator = directoryHandle.values();
      let result = await iterator.next();
      while (!result.done) {
        let fileSystemHandle = result.value;
        cbFileSystemHandle && cbFileSystemHandle(fileSystemHandle, parentDirectoryPath);
        if (fileSystemHandle.kind === 'directory') {
          let directoryPath = parentDirectoryPath;
          if (directoryPath === '') {
            directoryPath += fileSystemHandle.name;
          }
          else {
            directoryPath += '/' + fileSystemHandle.name;
          }

          await traverseFolder(await directoryHandle.getDirectoryHandle(fileSystemHandle.name), directoryPath);
        }
        result = await iterator.next();
      }
    };
    traverseFolder(directoryHandle, relativePath);
  }

  getLocalFileByUUID(fileUUID) {
    let splitPath = fileUUID.split('/');
    let experimentID = splitPath[0];
    splitPath.splice(0, 1);
    let localExperiment = this.serverExperiments.get(experimentID);
    let currentFolder = localExperiment.files;
    let file = undefined;
    while (splitPath.length > 0) {
      file = currentFolder.find(element => element.name === splitPath[0]);
      currentFolder = file.files;
      splitPath.splice(0, 1);
    }

    return file;
  }

  async hasLocalChanges(file) {
    if (!file || !file.fileSystemHandle || !file.dateSync) {
      return undefined;
    }
    return (file.dateSync < (await file.fileSystemHandle.getFile()).lastModified);
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();

    this.traverseLocalFiles(this.localSyncDirectoryHandle);
    //TODO: get experiments list and server file info automatically after parent sync dir has been chosen
  }

  async downloadExperimentFile(parentDirectory, serverFile) {
    let localFile = this.localFiles.get(serverFile.uuid);
    if (!localFile) {
      localFile = this.addLocalFile(serverFile.uuid);
    }
    let fileContent = await ExperimentStorageService.instance.getBlob(parentDirectory.uuid, serverFile.uuid, false);
    localFile.fileSystemHandle = await parentDirectory.directoryHandle.getFileHandle(serverFile.name, {create: true});
    let writable = await localFile.fileSystemHandle.createWritable();
    await writable.write(fileContent);
    await writable.close();
    localFile.dateSync = (await localFile.fileSystemHandle.getFile()).lastModified;
  }

  async downloadExperimentToLocalFS(experiment) {
    if (!this.localSyncDirectoryHandle) {
      return;
    }
    console.info('downloadExperimentToLocalFS');

    let rootDirectoryHandle = await this.localSyncDirectoryHandle.getDirectoryHandle(experiment.id, {create: true});
    if (!rootDirectoryHandle) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      //let relativePath = parentDirectory.uuid ? parentDirectory.uuid.substring(experiment.id.length) : undefined;
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.files = serverFileList;
      //TODO files download
      serverFileList.forEach(async (file) => {
        try {
          if (file.type === 'file') {
            await this.downloadExperimentFile(parentDirectory, file);
          }
          else if (file.type === 'folder') {
            file.directoryHandle = await parentDirectory.directoryHandle.getDirectoryHandle(file.name, {create: true});
            downloadFiles(file);
          }
          let fileSystemHandle = this.localFiles.get(file.uuid);
          if (!fileSystemHandle) {
            this.localFiles.set(file.uuid, file.fileHandle);
          }
        }
        catch (error) {
          console.error(error);
        }
      });
    };

    let serverExperiment = {
      uuid: experiment.uuid,
      name: experiment.configuration.name,
      directoryHandle: rootDirectoryHandle
    };
    downloadFiles(serverExperiment);

    this.serverExperiments.set(experiment.id, serverExperiment);
    console.info(serverExperiment);

    //TODO: if everything is ok, save localStorage reference to indicate experiment ID has a local FS clone at <dir>
    // this would be useful to store local sync directories and setups to be re-initialized in the next session
    // seems we can't get the full path with current API, try other solutions
  }

  uploadLocalFSExperimentToStorage(experiment) {
    console.info('uploadLocalFSExperimentToStorage');
    console.info(experiment);
    let localFiles = this.serverExperiments.get(experiment.id);
    console.info(localFiles);

    let uploadFolder = async (folder) => {
      let serverFiles = await ExperimentStorageService.instance.getExperimentFiles(folder.uuid);
      //TODO: parse local folder and upload new / renamed files instead of just server files
      folder.files.forEach(async file => {
        if (file.type === 'file') {
          let fileHandle = file.fileHandle;
          if (!fileHandle) {
            fileHandle = await localFiles.directoryHandle.getFileHandle(file);
          }
          let fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1);
          let contentType = getMimeByExtension(fileExtension);

          let localFileData = await fileHandle.getFile();
          if (localFileData.lastModified > file.dateSync) {
            console.info(localFileData.name + ' has been modified locally');
          }
          let serverFile = serverFiles.find(element => element.uuid === file.uuid);
          if (file.modifiedOn < serverFile.modifiedOn) {
            //TODO: error GUI from antoine
            console.info('WARNING! ' + file.name + ' has a newer version on the server, won\'t upload');
            file.dirtyOnServer = true;
            file.info = 'File version on server is newer!';
          }
          else {
            await ExperimentStorageService.instance.setFile(folder.uuid, file.name, localFileData, true, contentType);
          }
        }
        else if (file.type === 'folder') {
          uploadFolder(file);
        }
      });
    };
    uploadFolder(localFiles);
  }
}

RemoteExperimentFilesService.CONSTANTS = Object.freeze({
  INTERVAL_CHECK_LOCAL_FILES: 1000
});

export default RemoteExperimentFilesService;
