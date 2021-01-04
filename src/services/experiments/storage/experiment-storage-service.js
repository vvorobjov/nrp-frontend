import { HttpService } from '../../http-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const storageExperimentsURL = `${config.api.proxy.url}${endpoints.proxy.storage.experiments.url}`;
const availableServersURL = `${config.api.proxy.url}${endpoints.proxy.availableServers.url}`;

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
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentStorageService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Retrieves the list of template experiments from the proxy and stores
   * them in the experiments class property. If the experiments are already
   * there it just returns them, else does an HTTP request.
   *
   * @return experiments - the list of template experiments
   */
  async getExperiments() {
    if (!this.experiments) {
      let response = await this.httpRequestGET(storageExperimentsURL);
      this.experiments = await response.json();
      this.sortExperiments();
      await this.fillExperimentDetails();
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

  async fillExperimentDetails() {
    let response = await this.httpRequestGET(availableServersURL);
    let availableServers = await response.json();

    this.experiments.forEach(exp => {
      exp.availableServers = availableServers;
      if (!exp.configuration.brainProcesses && exp.configuration.bibiConfSrc) {
        exp.configuration.brainProcesses = 1;
      }
    });
  }
}

export default ExperimentStorageService;
