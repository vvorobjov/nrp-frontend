import DialogService from '../../dialog-service.js';
import { HttpProxyService } from '../../proxy/http-proxy-service';

import endpoints from '../../proxy/data/endpoints.json';

const proxyServerURL = `${endpoints.proxy.server.url}`;
const availableServersURL = `${endpoints.proxy.availableServers.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling server resources for simulating experiments.
 */
class ServerResourcesService extends HttpProxyService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.availableServers = [];

    this.startUpdates();
    window.addEventListener('beforeunload', (event) => {
      this.stopUpdates();
      event.returnValue = '';
    });
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ServerResourcesService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Start polling updates.
   */
  startUpdates() {
    this.intervalGetServerAvailability = setInterval(
      () => {
        this.getServerAvailability(true);
      },
      ServerResourcesService.CONSTANTS.INTERVAL_POLL_SERVER_AVAILABILITY
    );
  }

  /**
   * Stop polling updates.
   */
  stopUpdates() {
    this.intervalGetServerAvailability && clearInterval(this.intervalGetServerAvailability);
  }

  /**
   * Return a list of available servers for starting simulations.
   * @param {boolean} forceUpdate force an update
   * @returns {Array} A list of available servers.
   */
  async getServerAvailability(forceUpdate = false) {
    if (!this.availableServers || forceUpdate) {
      try{
        this.availableServers = await (await this.httpRequestGET(availableServersURL)).json();
        this.emit(ServerResourcesService.EVENTS.UPDATE_SERVER_AVAILABILITY, this.availableServers);
      }
      catch (error) {
        this.availableServers = [];
        const err = error || { message : 'unexpected network error '};
        DialogService.instance.networkError(err);
      }
    }
    this.emit(ServerResourcesService.EVENTS.UPDATE_SERVER_AVAILABILITY, this.availableServers);
    return this.availableServers;
  }

  /**
   * Get the server config for a given server ID.
   * @param {string} serverID - ID of the server
   * @returns {object} The server configuration
   */
  getServerConfig(serverID) {
    return this.httpRequestGET(proxyServerURL + '/' + serverID)
      .then(async (response) => {
        return await response.json();
      })
      .catch((error) => {
        error = error || { message: 'getServerConfig request rejected' };
        DialogService.instance.networkError(error);
        return error;
      });
  }
}

ServerResourcesService.EVENTS = Object.freeze({
  UPDATE_SERVER_AVAILABILITY: 'UPDATE_SERVER_AVAILABILITY'
});

ServerResourcesService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_SERVER_AVAILABILITY: 3000
});

export default ServerResourcesService;
