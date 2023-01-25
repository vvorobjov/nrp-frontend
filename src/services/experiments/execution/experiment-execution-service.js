import _ from 'lodash';

//import NrpAnalyticsService from '../../nrp-analytics-service.js';
import ServerResourcesService from './server-resources-service.js';
import SimulationService from './running-simulation-service.js';
import DialogService from '../../dialog-service';
import { HttpService } from '../../http-service.js';
import { EXPERIMENT_STATE } from '../experiment-constants.js';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling the execution of experiments, e.g. starting/stopping simulations etc.
 */
class ExperimentExecutionService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.stoppingExperiments = [];
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentExecutionService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Start a new simulation of an experiment, going through available servers.
   *
   * @param {object} experiment - experiment description
   * @param {boolean} launchSingleMode - launch in single mode
   */
  async startNewExperiment(
    experiment
  ) {
    //TODO: implement NrpAnalyticsService functionality
    //NrpAnalyticsService.instance.eventTrack('Start', { category: 'Experiment' });
    //NrpAnalyticsService.instance.tickDurationEvent('Server-initialization');

    ExperimentExecutionService.instance.emit(ExperimentExecutionService.EVENTS.START_EXPERIMENT, experiment);

    let fatalErrorOccurred = false;
    let serversToTry = experiment.devServer
      ? [experiment.devServer]
      : (await ServerResourcesService.instance.getServerAvailability(true)).map(s => s.id);

    //TODO: placeholder, register actual progress callback later
    let progressCallback = (msg) => {
      if (msg && msg.progress) {
        if (msg.progress.done) {
          DialogService.instance.progressNotification({message:'The experiment is loading'});
        }
        else {
          DialogService.instance.progressNotification({
            message: msg.progress.task,
            details: msg.progress.subtask
          });
        }
      }
    };

    let launchOnNextServer = async () => {
      if (!serversToTry.length) {
        //TODO: GUI feedback
        return Promise.reject(ExperimentExecutionService.ERRORS.LAUNCH_NO_SERVERS_LEFT);
      }
      if (fatalErrorOccurred) {
        //TODO: GUI feedback
        return Promise.reject(ExperimentExecutionService.ERRORS.LAUNCH_FATAL_ERROR);
      }

      let serverID = serversToTry.splice(0, 1)[0];
      let serverConfig = await ServerResourcesService.instance.getServerConfig(serverID);

      return await this.launchExperimentOnServer(
        experiment.id,
        experiment.private,
        experiment.configuration.configFile,
        serverID,
        serverConfig,
        progressCallback
      ).catch((failure) => {
        if (failure) {
          DialogService.instance.simulationError(failure);
        }
        fatalErrorOccurred = fatalErrorOccurred || failure.isFatal;

        return launchOnNextServer();
      });
    };

    return launchOnNextServer();
  };

  /**
   * Try launching an experiment on a specific server.
   * @param {string} experimentID - ID of the experiment to launch
   * @param {boolean} privateExperiment - whether the experiment is private or not
   * @param {string} configFile - experiment configuration file name
   * @param {string} serverID - server ID
   * @param {object} serverConfiguration - configuration of server
   * @param {function} progressCallback - a callback for progress updates
   * @returns {object} simulation config
   */
  launchExperimentOnServer(
    experimentID,
    privateExperiment,
    configFile,
    serverID,
    serverConfiguration,
    progressCallback
  ) {
    return new Promise((resolve, reject) => {
      _.defer(() => {
        //deferred.notify({ main: 'Create new Simulation...' });
        progressCallback({ main: 'Create new Simulation...' });
      }); //called once caller has the promise

      let serverURL = serverConfiguration.gzweb['nrp-services'];

      // Create a new simulation.
      // >>Request:
      // JSON
      // {
      //     'experimentID': string,             # REQUIRED
      //     'experimentConfiguration': string,  # default = experiment_configuration.json
      //     'state': string,                    # default = created
      //     'private': boolean                  # default = False
      // }
      let simInitData = {
        experimentID: experimentID,
        experimentConfiguration: configFile,
        state: EXPERIMENT_STATE.CREATED,
        private: privateExperiment
      };
      this.httpRequestPOST(serverURL + '/simulation', JSON.stringify(simInitData))
        .then((simulation) => {
          resolve(simulation);
        })
        .catch(reject);
      // <<Response:
      // HTTP 400: Experiment configuration is not valid
      // HTTP 402: Another simulation is already running on the server
      // HTTP 201: Simulation created successfully
      // JSON:
      // {
      //     'experimentID': string
      //     'environmentConfiguration': string
      //     'state': string,
      //     'simulationID': int
      //     'owner': string
      //     'creationDate': string
      // }
    });
  };

  stopExperiment(simulation) {
    return new Promise((resolve, reject) => {
      simulation.stopping = true;
      if (!this.stoppingExperiments[simulation.server]) {
        this.stoppingExperiments[simulation.server] = {};
      }
      this.stoppingExperiments[simulation.server][
        simulation.runningSimulation.simulationID
      ] = true;

      //TODO: re-implement
      /*this.storageServer.logActivity('simulation_stop', {
        simulationID: simulation.runningSimulation.experimentID
      });*/

      ServerResourcesService.instance
        .getServerConfig(simulation.server)
        .then((serverConfig) => {
          let serverURL = serverConfig.gzweb['nrp-services'];
          let simulationID = simulation.runningSimulation.simulationID;

          function updateSimulationState(state) {
            /*eslint-disable camelcase*/
            return SimulationService.instance.updateState(
              serverURL,
              simulationID,
              state
            );
          }

          return SimulationService.instance
            .getState(serverURL, simulationID)
            .then((data) => {
              if (!data || !data.state) {
                return Promise.reject();
              }

              // CREATED --(initialize)--> PAUSED --(stop)--> STOPPED
              if (data.state === EXPERIMENT_STATE.CREATED) {
                return updateSimulationState(EXPERIMENT_STATE.INITIALIZED).then(
                  _.partial(updateSimulationState, EXPERIMENT_STATE.STOPPED)
                );
              }
              // STARTED/PAUSED/HALTED --(stop)--> STOPPED
              else if (data.state === EXPERIMENT_STATE.STARTED ||
                data.state === EXPERIMENT_STATE.PAUSED ||
                data.state === EXPERIMENT_STATE.HALTED) {
                return updateSimulationState(EXPERIMENT_STATE.STOPPED);
              }

              return Promise.reject();
            });
          /*eslint-enable camelcase*/
        })
        .then(resolve)
        .catch(reject);
    });
  };
}

ExperimentExecutionService.EVENTS = Object.freeze({
  START_EXPERIMENT: 'START_EXPERIMENT',
  STOP_EXPERIMENT: 'STOP_EXPERIMENT'
});

ExperimentExecutionService.ERRORS = Object.freeze({
  LAUNCH_FATAL_ERROR: 'failed to launch experiment, encountered a fatal error',
  LAUNCH_NO_SERVERS_LEFT: 'failed to launch experiment, no available server could successfully start it'
});

export default ExperimentExecutionService;
