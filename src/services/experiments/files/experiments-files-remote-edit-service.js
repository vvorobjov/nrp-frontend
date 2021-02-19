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

    //this.localDirectoryHandles = new Map();
    //this.experimentFileStructures = new Map();

    this.localSyncDirectoryHandle = undefined;
    this.localSetups = new Map();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentsFilesRemoteEditService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async chooseLocalSyncDirectory() {
    this.localSyncDirectoryHandle = await window.showDirectoryPicker();
  }

  async downloadExperimentToLocalFS(experiment) {
    if (!this.localSyncDirectoryHandle) {
      return;
    }

    console.info(experiment);
    let directoryHandle = await this.localSyncDirectoryHandle.getDirectoryHandle(experiment.id, {create: true});
    console.info(directoryHandle);
    if (!directoryHandle) {
      return;
    }
    //this.localDirectoryHandles.set(experiment.id, localDirectoryHandle);

    let localExperimentSetup = {
      directoryHandle: directoryHandle,
      fileStructure: []
    };

    let experimentFiles = await ExperimentStorageService.instance.getExperimentFiles(experiment.id);
    console.info(experimentFiles);
    //let experimentFileStructure = [];
    //this.experimentFileStructures.set(experiment.id, experimentFileStructure);
    //TODO: (sub)directory parsing
    experimentFiles.forEach(async (file) => {
      try {
        if (file.type === 'file') {
          localExperimentSetup.fileStructure.push(file.name);

          let fileContent = await ExperimentStorageService.instance.getBlob(experiment.id, file.name, true);
          let fileHandle = await directoryHandle.getFileHandle(file.name, {create: true});
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

    this.localSetups.set(experiment.id, localExperimentSetup);

    //TODO: if everything is ok, save localStorage reference to indicate experiment ID has a local FS clone at <dir>
    // this would be useful to store local sync directories and setups to be re-initialized in the next session
    // seems we can't get the full path with current API, try other solutions
  }

  async uploadLocalFSExperiment(experiment) {
    let localSetup = this.localSetups.get(experiment.id);
    console.info(localSetup.fileStructure);
    localSetup.fileStructure.forEach(file => {
    });
  }
}

export default ExperimentsFilesRemoteEditService;
