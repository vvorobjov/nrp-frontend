import DialogService from '../../dialog-service.js';
import { HttpService } from '../../http-service.js';
import { EXPERIMENT_STATE } from '../experiment-constants.js';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

const INTERVAL_CHECK_SIMULATION_READY = 1000;
// Upper bound on the number of polls before giving up, so simulationReady can
// never spin forever (e.g. a server stuck in a pending state or a mismatching
// creationUniqueID). ~60 polls * 1s ≈ 1 minute.
const MAX_CHECK_SIMULATION_READY_ATTEMPTS = 60;

/**
 * Service handling state and info of running simulations.
 */
class SimulationService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new SimulationService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Check whether a simulation on a server is ready to be started.
   * @param {string} serverURL - URL of the server where simulation should be run
   * @param {string} creationUniqueID - Unique ID generated while trying to launch experiment
   * @param {object} [options] - optional overrides ({ interval, maxAttempts }), mainly for testing
   * @returns {Promise} Whether simulation is ready to start
   */
  simulationReady(serverURL, creationUniqueID, options = {}) {
    const interval = options.interval || INTERVAL_CHECK_SIMULATION_READY;
    const maxAttempts = options.maxAttempts || MAX_CHECK_SIMULATION_READY_ATTEMPTS;

    return new Promise((resolve, reject) => {
      let attempts = 0;
      let verifySimulation = () => {
        setTimeout(() => {
          attempts++;
          this.httpRequestGET(serverURL + '/simulation')
            .then(async (reponse) => {
              let continueVerify = true;
              let simulations = await reponse.json();

              if (simulations.length > 0) {
                let last = simulations.length - 1;
                let state = simulations[last].state;

                if (state === EXPERIMENT_STATE.PAUSED || state === EXPERIMENT_STATE.INITIALIZED) {
                  if (simulations[last].creationUniqueID === creationUniqueID) {
                    continueVerify = false;
                    resolve(simulations[last]);
                  }
                  else {
                    // A mismatching creationUniqueID means this is not our
                    // simulation and it never will be. Stop polling and reject
                    // instead of spinning forever.
                    continueVerify = false;
                    reject(new Error('Simulation creationUniqueID mismatch'));
                  }
                }
                else if (state === EXPERIMENT_STATE.HALTED || state === EXPERIMENT_STATE.FAILED) {
                  continueVerify = false;
                  reject(state);
                }
              }

              if (continueVerify) {
                if (attempts >= maxAttempts) {
                  reject(new Error('Timed out waiting for the simulation to become ready'));
                }
                else {
                  verifySimulation();
                }
              }
            })
            .catch(reject);
        }, interval);
      };

      verifySimulation();
    });
  };

  // /**
  //  * Subscribe to status info topics.
  //  * @param {string} rosbridgeWebsocket - ROS websocket URL
  //  * @param {*} setProgressMessage - callback to be called with new status info
  //  */
  // startRosStatusInformation(rosbridgeWebsocket) {
  //   this.stopRosStatusInformation(rosbridgeWebsocket);

  //   let rosConnection = RoslibService.instance.getConnection(rosbridgeWebsocket);
  //   let statusTopic = RoslibService.instance.createStringTopic(
  //     rosConnection,
  //     config['ros-topics'].status
  //   );
  //   rosStatusTopics.set(rosbridgeWebsocket, statusTopic);

  //   this.addRosStatusInfoCallback(rosbridgeWebsocket, (msg) => {
  //     if (msg.state && msg.state === EXPERIMENT_STATE.STOPPED) {
  //       this.stopRosStatusInformation(rosbridgeWebsocket);
  //     }
  //   });
  // };

  // stopRosStatusInformation(rosbridgeWebsocket) {
  //   let statusTopic = rosStatusTopics.get(rosbridgeWebsocket);
  //   if (!statusTopic) {
  //     return;
  //   }

  //   // remove the progress bar callback only, unsubscribe terminates the rosbridge
  //   // connection for any other subscribers on the status topic
  //   statusTopic.unsubscribe(); // fully disconnects rosbridge
  //   statusTopic.removeAllListeners();
  //   rosStatusTopics.delete(rosbridgeWebsocket);
  // }

  // startRosCleErrorInfo(rosbridgeWebsocket) {
  //   //TODO
  // }

  // addRosStatusInfoCallback(rosbridgeWebsocket, infoCallback) {
  //   if (!rosStatusTopics.has(rosbridgeWebsocket)) {
  //     this.startRosStatusInformation(rosbridgeWebsocket);
  //   }

  //   let statusTopic = rosStatusTopics.get(rosbridgeWebsocket);
  //   statusTopic.subscribe((data) => {
  //     let message = JSON.parse(data.data);
  //     if (message) {
  //       infoCallback(message);
  //     }
  //   });
  // }

  /**
   * Get the state the simulation is currently in.
   * @param {string} serverURL URL of the server the simulation is running on
   * @param {number} simulationID ID of the simulation
   * @returns {object} The simulation state
   */
  async getState(serverURL, simulationID) {
    let url = serverURL + '/simulation/' + simulationID + '/state';
    try {
      let response = await (await this.httpRequestGET(url)).json();
      return response;
    }
    catch (error) {
      DialogService.instance.networkError(error);
    }
  }

  /**
   * Set the state for a simulation.
   * @param {string} serverURL URL of the server the simulation is running on
   * @param {number} simulationID ID of the simulation
   * @param {EXPERIMENT_STATE} state state to set for the simulation
   */
  async updateState(serverURL, simulationID, state) {
    let url = serverURL + '/simulation/' + simulationID + '/state';
    try {
      let response = await this.httpRequestPUT(url, JSON.stringify({ state: state }));
      return await response.json();
    }
    catch (error) {
      DialogService.instance.simulationError(error);
      return { state: EXPERIMENT_STATE.FAILED };
    }
  }

  /**
   * Get simulation information.
   * @param {string} serverURL The full URL of the server the simulation is running on
   * @param {string} simulationID The simulation ID
   * @returns The simulation information
   */
  async getInfo(serverURL, simulationID) {
    let url = serverURL + '/simulation/' + simulationID;
    try {
      let response = await (await this.httpRequestGET(url)).json();
      return response;
    }
    catch (error) {
      DialogService.instance.networkError(error);
    }
  }
}

export default SimulationService;
