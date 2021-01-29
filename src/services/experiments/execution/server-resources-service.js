import _ from 'lodash';
import { Subject, timer } from 'rxjs';
import { switchMap, filter, map, multicast } from 'rxjs/operators';

import ErrorHandlerService from '../../error-handler-service.js';
import { HttpService } from '../../http-service.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const proxyServerURL = `${config.api.proxy.url}${endpoints.proxy.server.url}`;
const slurmMonitorURL = `${config.api.slurmmonitor.url}/api/v1/partitions/interactive`;
const availableServersURL = `${config.api.proxy.url}${endpoints.proxy.availableServers.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const INTERVAL_POLL_SLURM_MONITOR = 5000;
const INTERVAL_POLL_SERVER_AVAILABILITY = 3000;
let clusterAvailability = { free: 'N/A', total: 'N/A' };

/**
 * Service handling server resources for simulating experiments.
 */
class ServerResourcesService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.availableServers = [];

    this.startUpdates();
    window.onbeforeunload = () => {
      this.stopUpdates();
    };
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
    this.clusterAvailabilityObservable = this._createSlurmMonitorObservable();
    this.clusterAvailabilitySubscription = this.clusterAvailabilityObservable.subscribe(
      availability => (clusterAvailability = availability)
    );

    this.getServerAvailability(true);
    this.intervalGetServerAvailability = setInterval(
      () => {
        this.getServerAvailability(true);
      },
      INTERVAL_POLL_SERVER_AVAILABILITY
    );
  }

  /**
   * Stop polling updates.
   */
  stopUpdates() {
    this.clusterAvailabilitySubscription && this.clusterAvailabilitySubscription.unsubscribe();
    this.intervalGetServerAvailability && clearInterval(this.intervalGetServerAvailability);
  }

  /**
   * Get available cluster server info.
   * @returns {object} cluster availability info
   */
  getClusterAvailability() {
    return clusterAvailability;
  }

  /**
   * Return a list of available servers for starting simulations.
   * @param {boolean} forceUpdate force an update
   * @returns {Array} A list of available servers.
   */
  getServerAvailability(forceUpdate = false) {
    if (!this.availableServers || forceUpdate) {
      let update = async () => {
        let response = await this.httpRequestGET(availableServersURL);
        this.availableServers = await response.json();
      };
      update();
      this.emit(ServerResourcesService.EVENTS.UPDATE_SERVER_AVAILABILITY, this.availableServers);
    }

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
      .catch(ErrorHandlerService.instance.displayServerHTTPError);
  }

  _createSlurmMonitorObservable() {
    return timer(0, INTERVAL_POLL_SLURM_MONITOR)
      .pipe(switchMap(() => {
        try {
          return this.httpRequestGET(slurmMonitorURL);
        }
        catch (error) {
          _.once(error => {
            if (error.status === -1) {
              error = Object.assign(error, {
                data: 'Could not probe vizualization cluster'
              });
            }
            ErrorHandlerService.instance.displayServerHTTPError(error);
          });
        }
      }))
      .pipe(filter(e => e))
      .pipe(map(({ free, nodes }) => ({ free, total: nodes[3] })))
      .pipe(multicast(new Subject())).refCount();
  }
}

ServerResourcesService.EVENTS = Object.freeze({
  UPDATE_SERVER_AVAILABILITY: 'UPDATE_SERVER_AVAILABILITY'
});

export default ServerResourcesService;
