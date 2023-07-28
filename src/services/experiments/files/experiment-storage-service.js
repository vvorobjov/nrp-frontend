import { HttpProxyService, NRPProxyError } from '../../proxy/http-proxy-service';
import { EXPERIMENT_RIGHTS } from '../experiment-constants';

import endpoints from '../../proxy/data/endpoints.json';
import DialogService from '../../dialog-service.js';

const SCAN_STORAGE_URL = `${endpoints.proxy.storage.scanStorage.url}`;
const storageURL = `${endpoints.proxy.storage.url}`;
const storageExperimentsURL = `${endpoints.proxy.storage.experiments.url}`;
const cloneURL = `${endpoints.proxy.storage.clone.url}`;


let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles storage experiment files and configurations given
 * that the user has authenticated successfully.
 */
class ExperimentStorageService extends HttpProxyService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.default_DataPackProcessor = 'tf';
    this.default_SimulationLoop = 'FTILoop';
    this.default_SimulationTimestep = 0.01;
    this.default_ProcessLauncherType = 'Basic';
    this.default_SimulationTimeout = 0;

    this.startUpdates();
    window.addEventListener('beforeunload', (event) => {
      this.stopUpdates();
      event.returnValue = '';
    });
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentStorageService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Start polling updates.
   */
  startUpdates() {
    this.getExperiments(true);
    this.intervalPollExperiments = setInterval(
      () => {
        this.getExperiments(true);
      },
      ExperimentStorageService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS
    );
  }

  /**
   * Stop polling updates.
   */
  stopUpdates() {
    this.intervalPollExperiments && clearInterval(this.intervalPollExperiments);
  }

  /**
   * Retrieves the list of template experiments from the proxy and stores
   * them in the experiments class property. If the experiments are already
   * there it just returns them, else does an HTTP request.
   *
   * @param {boolean} forceUpdate forces an update of the list
   * @return experiments - the list of template experiments
   */
  //TODO: between storage experiments and shared experiments, can this be unified?
  // move to experiment-configuration-service?
  async getExperiments(forceUpdate = false) {
    if (!this.experiments || forceUpdate) {
      try {
        let experimentList = await (await this.httpRequestGET(storageExperimentsURL)).json();
        // filter out experiments with incomplete configuration (probably storage corruption)
        experimentList = experimentList.filter(experiment => experiment.configuration);
        this.sortExperiments(experimentList);
        await this.fillExperimentDetails(experimentList);
        this.experiments = experimentList;
        this.emit(ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS, this.experiments);
      }
      catch (error) {
        this.experiments = null;
        if (error instanceof NRPProxyError) {
          DialogService.instance.networkError(error);
        }
        else {
          DialogService.instance.unexpectedError({ error : 'unexepected error '});
        }
      }
    }

    return this.experiments;
  };

  /**
   * Retrieves the thumbnail image for a given experiment.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} thumbnailFilename - name of the thumbnail file
   *
   * TODO: [NRRPLT-8681] Fix endpoint
   *
   * @returns {Blob} image object
   */
  //TODO: between storage experiments and shared experiments, can this be unified?
  // move to experiment-configuration-service?
  async getThumbnail(experimentName, thumbnailFilename) {
    return await this.getBlob(experimentName, thumbnailFilename, true);
  }

  /**
   * Sort the local list of experiments alphabetically.
   */
  //TODO: between storage experiments and shared experiments, can this be unified?
  // move to experiment-configuration-service?
  sortExperiments(experimentList) {
    experimentList = experimentList.sort(
      (a, b) => {
        let nameA = a.configuration.SimulationName.toLowerCase();
        let nameB = b.configuration.SimulationName.toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      }
    );
  }

  /**
   * Fill in some details for the local experiment list that might be missing.
   */
  //TODO: between storage experiments and shared experiments, can this be unified?
  // move to experiment-configuration-service?
  async fillExperimentDetails(experimentList) {
    let experimentUpdates = [];
    experimentList.forEach(experiment => {
      if (!experiment.configuration.DataPackProcessor) {
        experiment.configuration.DataPackProcessor = this.default_DataPackProcessor;
      }
      if (!experiment.configuration.SimulationLoop) {
        experiment.configuration.SimulationLoop = this.default_SimulationLoop;
      }
      if (!experiment.configuration.SimulationTimestep) {
        experiment.configuration.SimulationTimestep = this.default_SimulationTimestep;
      }

      if (!experiment.configuration.ProcessLauncherType) {
        experiment.configuration.ProcessLauncherType = this.default_ProcessLauncherType;
      }

      if (!experiment.configuration.SimulationTimeout) {
        experiment.configuration.SimulationTimeout = this.default_SimulationTimeout;
      }
      // retrieve the experiment thumbnail
      // TODO: [NRRPLT-8681]
      /*experimentUpdates.push(this.getThumbnail(experiment.name, experiment.configuration.thumbnail)
        .then(thumbnail => {
          experiment.thumbnailURL = URL.createObjectURL(thumbnail);
        }));*/

      experiment.rights = EXPERIMENT_RIGHTS.OWNED;
      experiment.rights.launch = (experiment.private && experiment.owned) || !experiment.private;
    });

    return Promise.all(experimentUpdates);
  }

  /**
   * Clone a storage experiment
   * @param {Object} experiment The Experiment configuration
   */
  async cloneExperiment(experiment) {
    let experimentName = experiment.name;
    this.httpRequestPUT(cloneURL + '/' + experimentName);
  }

  /**
   * Gets an experiment file from the storage.
   * @param {string} experimentDirectoryPath - path of experiment folder + possibly subfolders
   * @param {string} filename - name of the file
   * @param {Boolean} byName - whether to check for the file by name or not
   *
   * @returns the file contents (as a request object)
   */
  async getFile(experimentDirectoryPath, filename, byName = false) {
    let directory = experimentDirectoryPath.replace(/[\/]/g, '%2F');
    let file = filename.replace(/[\/]/g, '%2F');
    const url = `${endpoints.proxy.storage.url}/${directory}/${file}?byname=${byName}`;
    return this.httpRequestGET(url);
  }

  /**
   * Gets the list of the experiment files from the storage.
   * @param {string} experimentName - the name of the experiment (experiment.name)
   *
   * @returns {Array} the list of experiment files
   */
  async getExperimentFiles(experimentName) {
    let experiment = experimentName.replace(/[\/]/g, '%2F');
    let url = `${endpoints.proxy.storage.url}/${experiment}`;
    const files = await (await this.httpRequestGET(url)).json();
    return files;
  }

  /**
   * Gets a file from the storage as a blob.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} filename - name of the file
   * @param {Boolean} byName - whether to check for the file by name or not
   *
   * @returns {Blob} the contents of the file as a blob
   */
  async getBlob(experimentName, filename, byName) {
    return await (await this.getFile(experimentName, filename, byName)).blob();
  }


  /**
   * Gets a file from the storage as text.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} filename - name of the file
   * @param {Boolean} byName - whether to check for the file by name or not (default TRUE)
   *
   * @returns {Blob} the contents of the file as text
   */
  async getFileText(experimentName, filename, byName = true) {
    return await (await this.getBlob(experimentName, filename, byName)).text();
  }


  /**
   * Deletes an experiment entity (folder or file) from the storage.
   * Called by other functions, not to be called independently.
   *
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} entityName - name of the entity
   * @param {Boolean} byname - whether to check for the entity by name or not
   * @param {string} type - folder or file
   *
   * @returns the request object containing the status code
   */
  async deleteEntity(experimentName, entityName, byname, type) {
    const url = this.createRequestURL(
      `${endpoints.proxy.storage.url}/${experimentName}/${entityName}`,
      {
        byname: byname,
        type: type
      }
    );

    return this.httpRequestDELETE(url);
  }

  /**
   * Deletes an experiment file from the storage.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} filename - name of the file
   * @param {Boolean} byname - whether to check for the file by name or not
   *
   * @returns the request object containing the status code
   */
  async deleteFile(experimentName, filename, byname = false) {
    return this.deleteEntity(experimentName, filename, byname, 'file');
  }

  /**
   * Deletes an experiment folder from the storage.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} folderName - name of the folder
   * @param {Boolean} byname - whether to check for the folder by name or not
   *
   * @returns the request object containing the status code
   */
  async deleteFolder(experimentName, folderName, byname = false) {
    return this.deleteEntity(experimentName, folderName, byname, 'folder');
  }

  /**
   * Deletes an experiment from storage.
   * @param {string} experimentName name of the experiment
   */
  async deleteExperiment(experimentName) {
    let url = storageURL + '/' + experimentName;
    return this.httpRequestDELETE(url);
  }

  /**
   * Creates a file in an experiment folder from the storage.
   * @param {string} experimentName - name of the experiment (directory on the server)
   * @param {string} filename - name of the file
   * @param data - the file contents in the corresponding
   * type (i.e. application/json, text/plain, application/octet-stream)
   * @param {Boolean} byname - whether to create the file by name or not
   * @param {string} contentType - the conten type of the file
   *
   * @returns the request object containing the status code
   */
  async setFile(experimentName, filename, data, byname = true, contentType = 'text/plain') {
    let directory = experimentName.replace(/[\/]/g, '%2F');
    console.info(`${endpoints.proxy.storage.url}/${directory}/${filename}`);
    const url = this.createRequestURL(
      `${endpoints.proxy.storage.url}/${directory}/${filename}`,
      {
        byname: byname
      }
    );

    let requestOptions = {
      ...this.PUTOptions, ...{ headers: { 'Content-Type': contentType } }
    };

    if (contentType === 'text/plain') {
      return this.httpRequestPUT(url, data, requestOptions);
    }
    else if (contentType === 'application/json') {
      return this.httpRequestPUT(url, JSON.stringify(data), requestOptions);
    }
    else if (contentType === 'application/octet-stream') {
      // placeholder for blob files where the data has to be transormed,
      // possibly to Uint8Array
      return this.httpRequestPUT(url,/* new Uint8Array(data) */data, requestOptions);
    }
    else {
      return new Error('Content-Type for setFile request not specified,' +
        'please make sure that the contentType and the body type match.');
    }
  }

  /**
   * Trigger proxy to scan storage.
   * @returns {promise} Result
   */
  async scanStorage() {
    return await (await this.httpRequestPOST(SCAN_STORAGE_URL)).json();
  }

  async renameExperiment(experimentID, newName) {
    const url = storageExperimentsURL + '/' + experimentID + '/rename';
    return await this.httpRequestPUT(url, JSON.stringify({newSimulationName: newName}));
  }
}

ExperimentStorageService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

ExperimentStorageService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: 3000
});

export default ExperimentStorageService;
