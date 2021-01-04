import _ from 'lodash';
import {Subject, timer}from 'rxjs';
import { switchMap, filter, map, multicast } from 'rxjs/operators';

import ErrorHandlerService from '../../error-handler-service.js';
import RoslibService from '../../roslib-service.js';
import { HttpService } from '../../http-service.js';
import { EXPERIMENT_STATE } from '../experiment-constants.js';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const proxyServerURL = `${config.api.proxy.url}${endpoints.proxy.server.url}`;
const slurmMonitorURL = `${config.api.slurmmonitor.url}/api/v1/partitions/interactive`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

let rosConnections = new Map();
const SLURM_MONITOR_POLL_INTERVAL = 5000;
let clusterAvailability = { free: 'N/A', total: 'N/A' };

/**
 * Service handling server resources for simulating experiments.
 */
class ExperimentServerService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.clusterAvailabilityObservable = timer(0, SLURM_MONITOR_POLL_INTERVAL)
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

    this.startUpdates();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentServerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Start polling updates.
   */
  startUpdates() {
    this.clusterAvailabilitySubscription = this.clusterAvailabilityObservable.subscribe(
      availability => (clusterAvailability = availability)
    );
  }

  /**
   * Stop polling updates.
   */
  //TODO: find proper place to call
  stopUpdates() {
    this.clusterAvailabilitySubscription && this.clusterAvailabilitySubscription.unsubscribe();
  }

  /**
   * Get available cluster server info.
   * @returns {object} cluster availability info
   */
  getClusterAvailability() {
    return clusterAvailability;
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
      .catch(/*serverError.displayHTTPError*/ErrorHandlerService.instance.displayServerHTTPError);
  }

  /**
   * Initialize config files on a server for a simulation.
   * @param {string} serverBaseUrl - URL of the server
   * @param {string} simulationID - ID of the simulation
   * @returns {object} The initialized config files
   */
  async initConfigFiles(serverBaseUrl, simulationID) {
    let cachedConfigFiles = undefined;
    try {
      let url = serverBaseUrl + '/simulation/' + simulationID + '/resources';
      let response = await this.httpRequestGET(url);
      cachedConfigFiles = await response.json().resources;
    }
    catch (error) {
      ErrorHandlerService.instance.displayServerHTTPError(error);
    }

    return cachedConfigFiles;
  }

  /**
   * Check whether a simulation on a server is ready to be started.
   * @param {string} serverURL - URL of the server where simulation should be run
   * @param {string} creationUniqueID - Unique ID generated while trying to launch experiment
   * @returns {Promise} Whether simulation is ready to start
   */
  simulationReady(serverURL, creationUniqueID) {
    return new Promise((resolve, reject) => {
      let verifySimulation = () => {
        setTimeout(() => {
          this.httpRequestGET(serverURL + '/simulation').then(function(simulations) {
            let continueVerify = true;

            if (simulations.length > 0) {
              let last = simulations.length - 1;
              let state = simulations[last].state;

              if (state === EXPERIMENT_STATE.PAUSED || state === EXPERIMENT_STATE.INITIALIZED) {
                if (simulations[last].creationUniqueID === creationUniqueID) {
                  continueVerify = false;
                  resolve(simulations[last]);
                }
                else {
                  reject();
                }
              }
              else if (state === EXPERIMENT_STATE.HALTED || state === EXPERIMENT_STATE.FAILED) {
                continueVerify = false;
                reject();
              }
            }

            if (continueVerify) {
              verifySimulation();
            }
          }).catch(reject);
        }, 1000);
      };

      verifySimulation();
    });
  };

  /**
   * Subscribe to status info topics.
   * @param {string} rosbridgeWebsocket - ROS websocket URL
   * @param {*} setProgressMessage - callback to be called with new status info
   */
  registerForRosStatusInformation(rosbridgeWebsocket, setProgressMessage) {
    let destroyCurrentConnection = () => {
      if (rosConnections.has(rosbridgeWebsocket)) {
        let statusListener = rosConnections.get(rosbridgeWebsocket).statusListener;
        // remove the progress bar callback only, unsubscribe terminates the rosbridge
        // connection for any other subscribers on the status topic
        statusListener.removeAllListeners();
        rosConnections.delete(rosbridgeWebsocket);
      }
    };

    destroyCurrentConnection();

    let rosConnection = RoslibService.instance.getOrCreateConnectionTo(rosbridgeWebsocket);
    let statusListener = RoslibService.instance.createStringTopic(
      rosConnection,
      config['ros-topics'].status
    );
    rosConnections.set(rosbridgeWebsocket, {rosConnection, statusListener});

    statusListener.subscribe((data) => {
      let message = JSON.parse(data.data);
      if (message && message.progress) {
        if (message.progress.done) {
          destroyCurrentConnection();
          setProgressMessage({ main: 'Simulation initialized.' });
        }
        else {
          setProgressMessage({
            main: message.progress.task,
            sub: message.progress.subtask
          });
        }
      }
    });
  };
}

export default ExperimentServerService;
