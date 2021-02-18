import { HttpService } from '../../http-service.js';
import ExperimentStorageService from './experiment-storage-service';

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

    this.localDirectoryHandles = new Map();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentsFilesRemoteEditService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async downloadExperimentToLocalFS(experiment) {
    console.info(experiment);

    let localDirectoryHandle = await window.showDirectoryPicker();
    console.info(localDirectoryHandle);
    if (!localDirectoryHandle) {
      return;
    }
    this.localDirectoryHandles.set(experiment.id, localDirectoryHandle);

    let experimentFiles = await ExperimentStorageService.instance.getExperimentFiles(experiment.id);
    console.info(experimentFiles);
    experimentFiles.forEach(async (file) => {
      try {
        if (file.type === 'file') {
          let fileContent = await ExperimentStorageService.instance.getBlob(experiment.id, file.name, true);

          let fileHandle = await localDirectoryHandle.getFileHandle(file.name, {create: true});
          //console.info(fileHandle);
          let writable = await fileHandle.createWritable();
          await writable.write(fileContent);
          await writable.close();
        }
      }
      catch (error) {
        console.error(error);
      }
    });

    //TODO: if everything is ok, save localStorage reference to indicate experiment ID has a local FS clone at <dir>
    // this can be used later during initialization to get earlier setup back
    localStorage.setItem(experiment.id, localDirectoryHandle);
  }

  async uploadLocalFSExperiment(experiment) {
    let localDirectoryHandle = this.localDirectoryHandles.get(experiment.id);
    let iterator = await localDirectoryHandle.keys();
    console.info(iterator);

    for ( let entry of iterator) {
      console.info(entry);
    }
  }
}

export default ExperimentsFilesRemoteEditService;
