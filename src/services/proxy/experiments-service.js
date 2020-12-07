import endpoints from './data/endpoints.json';
import config from '../../config.json';

import { HttpService } from '../http-service.js';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that fetches the template experiments list from the proxy given
 * that the user has authenticated successfully.
 */
class ExperimentsService extends HttpService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ExperimentsService.instance');
    }

    super();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentsService(SINGLETON_ENFORCER);
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
      const proxyEndpoint = endpoints.proxy;
      const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.storage.experiments.url}`;
      let response = await this.httpRequestGET(experimentsUrl);
      this.experiments = response.json();
    }

    return this.experiments;
  };

  /**
   * Retrieves the thumbnail image for a given experiment.
   * @param {object} experiment - experiment specification and configuration object
   *
   * @returns {Blob} image object
   */
  async getThumbnail(experiment) {
    let url = config.api.proxy.url + endpoints.proxy.storage.url + '/' + experiment.name + '/' + experiment.configuration.thumbnail + '?byname=true';
    let response = await this.httpRequestGET(url);
    let image = await response.blob();
    return image;
  }
}

export default ExperimentsService;
