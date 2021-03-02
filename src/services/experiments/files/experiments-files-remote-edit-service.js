import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';
import getMimeByExtension from '../../../utility/mime-type';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * TODO
 */
class ExperimentsFilesRemoteEditService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.localSyncDirectoryHandle = undefined;
    this.localSetups = new Map();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentsFilesRemoteEditService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  isSupported() {
    return window.showDirectoryPicker !== undefined && window.showDirectoryPicker !== null;
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();
  }

  async downloadExperimentToLocalFS(experiment) {
    if (!this.localSyncDirectoryHandle) {
      return;
    }
    console.info('downloadExperimentToLocalFS');

    //console.info(experiment);
    let rootDirectoryHandle = await this.localSyncDirectoryHandle.getDirectoryHandle(experiment.id, {create: true});
    if (!rootDirectoryHandle) {
      return;
    }

    let downloadFiles = async (parentDirectory) => {
      //let relativePath = parentDirectory.uuid ? parentDirectory.uuid.substring(experiment.id.length) : undefined;
      let fileList = await ExperimentStorageService.instance.getExperimentFiles(parentDirectory.uuid);
      parentDirectory.files = fileList;
      //TODO files download
      fileList.forEach(async (file) => {
        try {
          if (file.type === 'file') {
            let fileContent = await ExperimentStorageService.instance.getBlob(parentDirectory.uuid, file.uuid, false);
            file.fileHandle = await parentDirectory.directoryHandle.getFileHandle(file.name, {create: true});
            let writable = await file.fileHandle.createWritable();
            await writable.write(fileContent);
            await writable.close();
          }
          else if (file.type === 'folder') {
            file.directoryHandle = await parentDirectory.directoryHandle.getDirectoryHandle(file.name, {create: true});
            downloadFiles(file);
          }
        }
        catch (error) {
          console.error(error);
        }
      });
    };

    let localExperimentSetup = {
      uuid: experiment.uuid,
      directoryHandle: rootDirectoryHandle
    };
    downloadFiles(localExperimentSetup);

    this.localSetups.set(experiment.id, localExperimentSetup);
    console.info(localExperimentSetup);

    //TODO: if everything is ok, save localStorage reference to indicate experiment ID has a local FS clone at <dir>
    // this would be useful to store local sync directories and setups to be re-initialized in the next session
    // seems we can't get the full path with current API, try other solutions
  }

  uploadLocalFSExperimentToStorage(experiment) {
    console.info('uploadLocalFSExperimentToStorage');
    console.info(experiment);
    let localSetup = this.localSetups.get(experiment.id);
    console.info(localSetup);

    //TODO: folders and subfolders / files inside
    //TODO: check modification date on server before uploading
    let uploadFolder = async (folder) => {
      folder.files.forEach(async file => {
        if (file.type === 'file') {
          let fileHandle = file.fileHandle;
          if (!fileHandle) {
            fileHandle = await localSetup.directoryHandle.getFileHandle(file);
          }
          let fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1);
          //console.info(fileExtension);
          let contentType = getMimeByExtension(fileExtension);
          //console.info(contentType);

          let fileData = await fileHandle.getFile();
          await ExperimentStorageService.instance.setFile(folder.uuid, file.name, fileData, true, contentType);
        }
        else if (file.type === 'folder') {
          uploadFolder(file);
        }
      });
    };
    uploadFolder(localSetup);
  }
}

export default ExperimentsFilesRemoteEditService;
