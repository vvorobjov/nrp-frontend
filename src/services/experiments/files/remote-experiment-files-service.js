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

          let localFile = this.localFiles.get(fileRelativePath)
            || await this.addLocalFile(fileRelativePath, fileSystemHandle);

          if (localFile.fileSystemHandle.kind === 'file') {
            localFile.hasLocalChanges = await this.hasLocalChanges(localFile);
          }

          localFile.untracked = !this.hasServerFile(localFile);
          localFile.isOutOfSync = this.isOutOfSync(localFile);
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
    let fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
    if (fileName.includes('.crswap')) {
      return;
    }

    let parentDirectoryPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
    let parentDirectory = this.localFiles.get(parentDirectoryPath);
    let parentDirectoryHandle = parentDirectory ? parentDirectory.fileSystemHandle : this.localSyncDirectoryHandle;
    if (!fileSystemHandle) {
      if (fileName.includes('.')) {
        fileSystemHandle = await parentDirectoryHandle.getFileHandle(fileName, {create: true});
      }
      else {
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

  async updateServerFiles(forceUpdate = false) {
    console.info('updateServerFiles');

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
    experiments.forEach(experiment => {
      let serverExperiment = {
        uuid: experiment.uuid,
        name: experiment.configuration.name
      };
      getDirectoryFiles(serverExperiment);

      this.serverExperiments.set(experiment.id, serverExperiment);
      console.info(serverExperiment);
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

  hasServerFile(localFile) {
    let splitPath = localFile.relativePath.split('/');
    let experimentID = splitPath[0];
    let hasExperiment = this.serverExperiments.has(experimentID);
    let hasFile = this.getServerFileByRelativePath(localFile.relativePath) !== undefined;
    return (hasExperiment && hasFile);
  }

  isOutOfSync(localFile) {
    let serverFile = this.getServerFileByRelativePath(localFile.relativePath);
    return localFile.dateSync && Date.parse(serverFile.modifiedOn) > localFile.dateSync;
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();

    if (this.localSyncDirectoryHandle) {
      await this.updateServerFiles();
    }
    this.traverseLocalFiles(this.localSyncDirectoryHandle);
    //TODO: get experiments list and server file info automatically after parent sync dir has been chosen
  }

  async downloadExperimentFile(serverFile) {
    let localFile = this.localFiles.get(serverFile.uuid);
    if (!localFile) {
      localFile = await this.addLocalFile(serverFile.uuid);
    }

    let parentDirectoryPath = serverFile.uuid.substring(0, serverFile.uuid.lastIndexOf('/'));
    let fileContent = await ExperimentStorageService.instance.getBlob(parentDirectoryPath, serverFile.uuid, false);
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

    let experimentRootDirectory = this.localFiles.get(experiment.uuid) || await this.addLocalFile(experiment.id);
    if (!experimentRootDirectory) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      let serverFileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.children = serverFileList;
      //TODO files download
      serverFileList.forEach(async (serverFile) => {
        try {
          serverFile.parent = parentDirectory;
          if (serverFile.type === 'file') {
            await this.downloadExperimentFile(serverFile);
          }
          else if (serverFile.type === 'folder') {
            await this.addLocalFile(serverFile.uuid);
            downloadFiles(serverFile);
          }
          /*let fileSystemHandle = this.localFiles.get(serverFile.uuid);
          if (!fileSystemHandle) {
            this.localFiles.set(serverFile.uuid, serverFile.fileHandle);
          }*/
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
          let serverFile = serverFiles.find(element => element.uuid === file.uuid);
          if (file.modifiedOn < serverFile.modifiedOn) {
            //TODO: error GUI from antoine
            console.info('WARNING! ' + file.name + ' has a newer version on the server, won\'t upload');
            file.dirtyOnServer = true;
            file.msgError = 'File version on server is newer! Will not upload.';
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

  /*async uploadExperimentFile(localFile) {
    let fileHandle = localFile.fileSystemHandle;
    if (!fileHandle) {
      console.warn('Could not upload ' + localFile.relativePath + ' - missing file handle.');
      return;
    }

    let localFileData = await fileHandle.getFile();
    let serverFile = this.getServerFileByRelativePath(localFile.relativePath);
    if (file.modifiedOn < serverFile.modifiedOn) {
      //TODO: error GUI from antoine
      console.info('WARNING! ' + file.name + ' has a newer version on the server, won\'t upload');
      file.dirtyOnServer = true;
      file.msgError = 'File version on server is newer! Will not upload.';
    }
    else {
      let fileExtension = fileHandle.name.substring(fileHandle.name.lastIndexOf('.') + 1);
      let contentType = getMimeByExtension(fileExtension);
      await ExperimentStorageService.instance.setFile(folder.uuid, file.name, localFileData, true, contentType);
    }
  }*/
}

RemoteExperimentFilesService.CONSTANTS = Object.freeze({
  INTERVAL_CHECK_LOCAL_FILES: 1000
});

export default RemoteExperimentFilesService;
