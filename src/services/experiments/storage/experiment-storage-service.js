import JSZip from 'jszip';

import { HttpService } from '../../http-service.js';
import ErrorHandlingService from '../../error-handler-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const storageExperimentsURL = `${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`;
const storageScanStorage = `${config.api.proxy.url}${endpoints.proxy.storage.scanStorage.url}`;
const storageImportExperiment = `${config.api.proxy.url}${endpoints.proxy.storage.importExperiment.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const INTERVAL_POLL_EXPERIMENTS = 3000;

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
    if (typeof window !== 'undefined'){
      window.onbeforeunload = () => {
        this.stopUpdates();
      };
    }
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
      INTERVAL_POLL_EXPERIMENTS
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
    let url = config.api.proxy.url + endpoints.proxy.storage.url +
      '/' + experimentName + '/' + thumbnailFilename + '?byname=true';
    let response = await this.httpRequestGET(url);
    let image = await response.blob();
    return image;
  }

  /**
   * Sort the local list of experiments alphabetically.
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

  async scanStorage() {
    let response = await this.httpRequestPOST(storageScanStorage);
    return response
      .then(this.getScanStorageResponse)
      .catch(this.createImportErrorPopup);
  }

  getScanStorageResponse(response) {
    let scanStorageResponse = {};
    ['deletedFolders', 'addedFolders'].forEach(name => {
      scanStorageResponse[`${name}Number`] = response[name].length;
      scanStorageResponse[name] = response[name].join(', ');
    });
    return scanStorageResponse;
  }

  async importExperiment(zipContent){
    let response = await this.httpRequestPOST(storageImportExperiment, zipContent);
    return response;
  }

  createImportErrorPopup(error) {
    ErrorHandlingService.instance.displayError({
      type: 'Import Error.',
      message: error.data
    });
  }

  getImportZipResponses(responses) {
    let importZipResponses = {};
    importZipResponses.numberOfZips = responses.length;
    ['zipBaseFolderName', 'destFolderName'].forEach(name => {
      importZipResponses[name] = responses
        .map(response => response[name])
        .join(', ');
    });
    return importZipResponses;
  }

  zipExperimentFolder(e) {
    let zip = new JSZip();
    let files = e.target.files;
    if (files.length === 0){
      return; // The folder upload was aborted by user
    }
    let promises = [];
    Array.from(files).forEach(file => {
      promises.push(
        new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onerror = err => {
            reader.abort();
            return reject(err);
          };
          reader.onload = f =>
            resolve([file.webkitRelativePath, f.target.result]);
          if (
            file.type.startsWith('image') ||
            file.type === 'application/zip' ||
            file.webkitRelativePath.split('.').pop() === 'h5'
          ) {
            reader.readAsArrayBuffer(file);
          }
          else {
            reader.readAsText(file);
          }
        })
          .then(([filepath, filecontent]) =>
            Promise.resolve(
              zip.file(filepath, filecontent, { createFolders: true })
            )
          )
          .catch(err => {
            this.createImportErrorPopup(err);
            return Promise.reject(err);
          })
      );
    });

    return Promise
      .all(promises)
      .then(() => zip.generateAsync({ type: 'blob' }))
      .catch(err => {
        this.createImportErrorPopup(err);
        return Promise.reject(err);
      });
  }

  importExperimentFolder(e) {
    return this.zipExperimentFolder(e).then(zipContent => {
      return ExperimentStorageService.instance
        .importExperiment(zipContent)
        .catch(this.createImportErrorPopup);
    });
  }

  readZippedExperimentExperiment(e) {
    let files = e.target.files;
    let zipFiles = [];
    Array.from(files).forEach(file => {
      if (file.type !== 'application/zip') {
        this.createImportErrorPopup(
          `The file ${file.name} cannot be imported because it is not a zip file.`
        );
      }
      else {
        zipFiles.push(file);
      }
    });
    let promises = zipFiles.map(zipFile => {
      return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = f => resolve(f.target.result);
        reader.readAsArrayBuffer(zipFile);
      });
    });
    return Promise.all(promises);
  }

  importZippedExperiment(e) {
    let promises = this.readZippedExperimentExperiment(e)
      .then(zipContents =>
        zipContents.map(zipContent =>
          ExperimentStorageService.instance.importExperiment(zipContent).catch(err => {
            this.createImportErrorPopup(err);
            return Promise.reject();
          })
        )
      )
      .then(responses =>
        Promise
          .all(responses)
          .then(responses => this.getImportZipResponses(responses))
      );
    return promises;
  }
}

ExperimentStorageService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

ExperimentStorageService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: INTERVAL_POLL_EXPERIMENTS
});

export default ExperimentStorageService;
