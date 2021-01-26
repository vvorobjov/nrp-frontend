import { HttpService } from '../../http-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const storageExperimentsURL = `${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`;

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
}

ExperimentStorageService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

ExperimentStorageService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: INTERVAL_POLL_EXPERIMENTS
});

export default ExperimentStorageService;
