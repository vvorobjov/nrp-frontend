import { HttpService } from '../../http-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const experimentsURL = `${config.api.proxy.url}${endpoints.proxy.experiments.url}`;
const cloneURL = `${config.api.proxy.url}${endpoints.proxy.storage.clone.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles storage experiment files and configurations given
 * that the user has authenticated successfully.
 */
class SharedExperimentsService extends HttpService {
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
      _instance = new SharedExperimentsService(SINGLETON_ENFORCER);
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
      SharedExperimentsService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS
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
      let response = await (await this.httpRequestGET(experimentsURL)).json();
      this.experiments = response.values();
      console.info(this.experiments);
      this.sortExperiments();
      //await this.fillExperimentDetails();
      this.emit(SharedExperimentsService.EVENTS.UPDATE_EXPERIMENTS, this.experiments);
    }

    return this.experiments;
  };

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

  /**
   * Clone an experiment setup to storage
   * @param {Object} experiment The Experiment configuration
   */
  async cloneExperiment(experiment) {
    let expPath = experiment.configuration.experimentConfiguration;
    let response = await this.httpRequestPOST(cloneURL, { expPath });
    console.info(response);
  }
}

SharedExperimentsService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

SharedExperimentsService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: 5000
});

export default SharedExperimentsService;
