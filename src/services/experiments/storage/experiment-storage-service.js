import { HttpService } from '../../http-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const storageExperimentsURL = `${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that fetches the template experiments list from the proxy given
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
  async getExperiments(forceUpdate = false) {
    if (!this.experiments || forceUpdate) {
      let response = await this.httpRequestGET(storageExperimentsURL);
      this.experiments = await response.json();
      this.sortExperiments();
      await this.fillExperimentDetails();
      this.emit(ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS, this.experiments);
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
  async getThumbnail(experimentName, thumbnailFilename) {
    return await this.getBlob(experimentName, thumbnailFilename, true);
  }

  /**
   * Sorts the experiment list alphabetically.
   *
   * @returns {Array} sorted experiment list
   */
  sortExperiments() {
    this.experiments = this.experiments.sort(
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
  async fillExperimentDetails() {
    this.experiments.forEach(exp => {
      if (!exp.configuration.brainProcesses && exp.configuration.bibiConfSrc) {
        exp.configuration.brainProcesses = 1;
      }
    });
  }

  /**
   * Gets an experiment file from the storage.
   * @param {string} experimentName - name of the experiment
   * @param {string} filename - name of the file
   * @param {Boolean} byName - whether to check for the file by name or not
   *
   * @returns the file contents (as a request object)
   */
  async getFile(experimentName, filename, byName = false) {
    const url = `${config.api.proxy.url}${endpoints.proxy.storage.url}/${experimentName}/${filename}?byname=${byName}`;
    return this.httpRequestGET(url);
  }

  /**
   * Gets the list of the experiment files from the storage.
   * @param {string} experimentName - name of the experiment
   *
   * @returns {Array} the list of experiment files
   */
  async getExperimentFiles(experimentName) {
    const url = `${config.api.proxy.url}${endpoints.proxy.storage.url}/${experimentName}`;
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
  async setFile(experimentName, filename, data, byname = true, contentType = 'text/plain') {
    const url = new URL(`${config.api.proxy.url}${endpoints.proxy.storage.url}/${experimentName}/${filename}`);
    url.searchParams.append('byname', byname);

    let requestOptions = {
      ...this.POSTOptions, ...{ headers: { 'Content-Type': contentType } }
    };

    if (contentType === 'text/plain') {
      return this.httpRequestPOST(url, requestOptions, data);
    }
    else if (contentType === 'application/json') {
      return this.httpRequestPOST(url, requestOptions, JSON.stringify(data));
    }
    else if (contentType === 'application/octet-stream') {
      // placeholder for blob files where the data has to be transormed,
      // possibly to Uint8Array
      return this.httpRequestPOST(url, requestOptions,/* new Uint8Array(data) */data);
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
