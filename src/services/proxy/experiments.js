import endpoints from "./data/endpoints.json";
import config from "../../config.json";

import { HttpService } from "../http-service.js";

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that fetches the template experiments list from the proxy given
 * that the user has authenticated successfully.
 */
class ExperimentsService extends HttpService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error("Use ExperimentsService.instance");
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
  getExperiments = () => {
    if (!this.experiments) {
      const proxyEndpoint = endpoints.proxy;
      const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.experiments.url}`;
      this.experiments = this.httpRequestGET(experimentsUrl);
    }

    return this.experiments;
  };
}

export default ExperimentsService;
