import { HttpService } from '../../http-service.js';
import { EXPERIMENT_RIGHTS } from '../experiment-constants';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
import DialogService from '../../dialog-service.js';

const storageURL = `${config.api.proxy.url}${endpoints.proxy.storage.url}`;
const storageExperimentsURL = `${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles storage experiment files and configurations given
 * that the user has authenticated successfully.
 */
class ExperimentStorageService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

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
        experimentList = experimentList.filter(experiment => experiment.configuration.experimentFile);
        this.sortExperiments(experimentList);
        await this.fillExperimentDetails(experimentList);
        this.experiments = experimentList;
        this.emit(ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS, this.experiments);
      }
      catch (error) {
        DialogService.instance.networkError(error);
      }
    }

    return this.experiments;
  };

  /**
   * Retrieves the thumbnail image for a given experiment.
   * @param {string} experimentName - name of the experiment
   * @param {string} thumbnailFilename - name of the thumbnail file
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
        let nameA = a.configuration.name.toLowerCase();
        let nameB = b.configuration.name.toLowerCase();
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
      if (!experiment.configuration.brainProcesses && experiment.configuration.bibiConfSrc) {
        experiment.configuration.brainProcesses = 1;
      }

      // retrieve the experiment thumbnail
      experimentUpdates.push(this.getThumbnail(experiment.name, experiment.configuration.thumbnail)
        .then(thumbnail => {
          experiment.thumbnailURL = URL.createObjectURL(thumbnail);
        }));

      experiment.rights = EXPERIMENT_RIGHTS.OWNED;
      experiment.rights.launch = (experiment.private && experiment.owned) || !experiment.private;
    });

    return Promise.all(experimentUpdates);
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
    let directory = experimentDirectoryPath.replaceAll('/', '%2F');
    let file = filename.replaceAll('/', '%2F');
    const url = `${config.api.proxy.url}${endpoints.proxy.storage.url}/${directory}/${file}?byname=${byName}`;
    return this.httpRequestGET(url);
  }

  /**
   * Gets the list of the experiment files from the storage.
   * @param {string} experimentDirectoryUUID - name of the experiment
   * @param {string} subFolder - relative path to a subfolder from which to get files
   *
   * @returns {Array} the list of experiment files
   */
  async getExperimentFiles(directoryPath) {
    let directory = directoryPath.replaceAll('/', '%2F');
    let url = `${config.api.proxy.url}${endpoints.proxy.storage.url}/${directory}`;
    const files = await (await this.httpRequestGET(url)).json();
    return files;
  }

  /**
   * Gets a file from the storage as a blob.
   * @param {string} experimentName - name of the experiment
   * @param {string} filename - name of the file
   * @param {Boolean} byName - whether to check for the file by name or not
   *
   * @returns {Blob} the contents of the file as a blob
   */
  async getBlob(experimentName, filename, byName) {
    return await (await this.getFile(experimentName, filename, byName)).blob();
  }


  /**
   * Deletes an experiment entity (folder or file) from the storage.
   * Called by other functions, not to be called independently.
   *
   * @param {string} experimentName - name of the experiment
   * @param {string} entityName - name of the entity
   * @param {Boolean} byname - whether to check for the entity by name or not
   * @param {string} type - folder or file
   *
   * @returns the request object containing the status code
   */
  async deleteEntity(experimentName, entityName, byname, type) {
    const url = new URL(`${config.api.proxy.url}${endpoints.proxy.storage.url}/${experimentName}/${entityName}`);
    url.searchParams.append('byname', byname);
    url.searchParams.append('type', type);

    return this.httpRequestDELETE(url);
  }

  /**
   * Deletes an experiment file from the storage.
   * @param {string} experimentName - name of the experiment
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
   * @param {string} experimentName - name of the experiment
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
   * @param {string} experimentID The experiment's ID
   */
  async deleteExperiment(experimentID) {
    let url = storageURL + '/' + experimentID;
    return this.httpRequestDELETE(url);
  }

  /**
   * Creates a file in an experiment folder from the storage.
   * @param {string} experimentName - name of the experiment
   * @param {string} filename - name of the file
   * @param data - the file contents in the corresponding
   * type (i.e. application/json, text/plain, application/octet-stream)
   * @param {Boolean} byname - whether to create the file by name or not
   * @param {string} contentType - the conten type of the file
   *
   * @returns the request object containing the status code
   */
  async setFile(directoryPath, filename, data, byname = true, contentType = 'text/plain') {
    let directory = directoryPath.replaceAll('/', '%2F');
    const url = new URL(`${config.api.proxy.url}${endpoints.proxy.storage.url}/${directory}/${filename}`);
    //console.info(url);
    url.searchParams.append('byname', byname);

    let requestOptions = {
      ...this.POSTOptions, ...{ headers: { 'Content-Type': contentType } }
    };
    //console.info(requestOptions);

    if (contentType === 'text/plain') {
      return this.httpRequestPOST(url, data, requestOptions);
    }
    else if (contentType === 'application/json') {
      return this.httpRequestPOST(url, JSON.stringify(data), requestOptions);
    }
    else if (contentType === 'application/octet-stream') {
      // placeholder for blob files where the data has to be transormed,
      // possibly to Uint8Array
      return this.httpRequestPOST(url,/* new Uint8Array(data) */data, requestOptions);
    }
    else {
      return new Error('Content-Type for setFile request not specified,' +
        'please make sure that the contentType and the body type match.');
    }
  }
}

ExperimentStorageService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

ExperimentStorageService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: 3000
});

export default ExperimentStorageService;
