import { HttpService } from '../../http-service.js';
import { EXPERIMENT_RIGHTS } from '../experiment-constants';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const experimentsURL = `${config.api.proxy.url}${endpoints.proxy.experiments.url}`;
const experimentImageURL = `${config.api.proxy.url}${endpoints.proxy.experimentImage.url}`;
const cloneURL = `${config.api.proxy.url}${endpoints.proxy.storage.clone.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles storage experiment files and configurations given
 * that the user has authenticated successfully.
 */
class PublicExperimentsService extends HttpService {
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
      _instance = new PublicExperimentsService(SINGLETON_ENFORCER);
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
      PublicExperimentsService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS
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
      let experimentList = Object.values(await (await this.httpRequestGET(experimentsURL)).json());
      this.sortExperiments(experimentList);
      await this.fillExperimentDetails(experimentList);
      this.experiments = experimentList;
      this.emit(PublicExperimentsService.EVENTS.UPDATE_EXPERIMENTS, this.experiments);
    }

    return this.experiments;
  };

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
      experimentUpdates.push(this.getThumbnailURL(experiment.configuration.id).then(thumbnailURL => {
        if (thumbnailURL) {
          experiment.thumbnailURL = thumbnailURL; //URL.createObjectURL(thumbnail);
        }
      }));

      experiment.rights = EXPERIMENT_RIGHTS.PUBLICLY_SHARED;
    });

    return Promise.all(experimentUpdates);
  }

  /**
   * Retrieves the thumbnail image for a given experiment.
   * @param {string} experimentName - name of the experiment
   * @param {string} thumbnailFilename - name of the thumbnail file
   *
   * @returns {Blob} image object
   */
  //TODO: between storage experiments and shared experiments, can this be unified?
  // move to experiment-configuration-service?
  async getThumbnailURL(experimentName) {
    let url = experimentImageURL + '/' + experimentName;
    return url;
  }

  /**
   * Clone an experiment setup to storage
   * @param {Object} experiment The Experiment configuration
   */
  async cloneExperiment(experiment) {
    let experimentConfigFilepath = experiment.configuration.experimentConfiguration;
    this.httpRequestPOST(cloneURL, JSON.stringify({ expPath: experimentConfigFilepath }));
  }
}

PublicExperimentsService.EVENTS = Object.freeze({
  UPDATE_EXPERIMENTS: 'UPDATE_EXPERIMENTS'
});

PublicExperimentsService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_EXPERIMENTS: 5000
});

export default PublicExperimentsService;