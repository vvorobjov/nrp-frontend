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
   * @param {object} reservation - server reservation
   * @param {object} playbackRecording - a recording of a previous execution
   * @param {*} profiler - a profiler option
   */
  async startNewExperiment(
    experiment,
    launchSingleMode,
    reservation,
    playbackRecording,
    profiler
  ) {
    //TODO: implement NrpAnalyticsService functionality
    //NrpAnalyticsService.instance.eventTrack('Start', { category: 'Experiment' });
    //NrpAnalyticsService.instance.tickDurationEvent('Server-initialization');

    ExperimentExecutionService.instance.emit(ExperimentExecutionService.EVENTS.START_EXPERIMENT, experiment);

    let fatalErrorOccurred = false;
    let serversToTry = experiment.devServer
      ? [experiment.devServer]
      : (await ServerResourcesService.instance.getServerAvailability(true)).map(s => s.id);

    let brainProcesses = launchSingleMode ? 1 : experiment.configuration.brainProcesses;

    //TODO: placeholder, register actual progress callback later
    let progressCallback = (notification) => {
      DialogService.instance.progressNotification(notification);
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
        brainProcesses,
        serverID,
        serverConfig,
        reservation,
        playbackRecording,
        profiler,
        progressCallback
      ).catch((failure) => {
        if (failure.error) {
          DialogService.instance.simulationError(failure.error);
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
   * @param {number} brainProcesses - number of brain processes to start with
   * @param {string} serverID - server ID
   * @param {object} serverConfiguration - configuration of server
   * @param {object} reservation - server reservation
   * @param {object} playbackRecording - recording
   * @param {object} profiler - profiler option
   * @param {function} progressCallback - a callback for progress updates
   */
  launchExperimentOnServer(
    experimentID,
    privateExperiment,
    brainProcesses,
    serverID,
    serverConfiguration,
    reservation,
    playbackRecording,
    profiler,
    progressCallback
  ) {
    return new Promise((resolve, reject) => {
      _.defer(() => {
        //deferred.notify({ main: 'Create new Simulation...' });
        progressCallback({ main: 'Create new Simulation...' });
      }); //called once caller has the promise

      let serverURL = serverConfiguration.gzweb['nrp-services'];
      let serverJobLocation =
        serverConfiguration.serverJobLocation || 'local';

      let simInitData = {
        gzserverHost: serverJobLocation,
        private: privateExperiment,
        experimentID: experimentID,
        brainProcesses: brainProcesses,
        reservation: reservation,
        creationUniqueID: (Date.now() + Math.random()).toString(),
        //ctxId: $stateParams.ctx, seems to not be used?
        profiler: profiler
      };

      if (playbackRecording) {
        simInitData.playbackPath = playbackRecording;
      }

      // Create a new simulation.
      this.httpRequestPOST(serverURL + '/simulation', JSON.stringify(simInitData));
      progressCallback({ main: 'Initialize Simulation...' });

      // register for messages during initialization
      SimulationService.instance.registerForRosStatusInformation(
        serverConfiguration.rosbridge.websocket,
        progressCallback
      );

      SimulationService.instance.simulationReady(serverURL, simInitData.creationUniqueID)
        .then((simulation) => {
          SimulationService.instance.initConfigFiles(serverURL, simulation.simulationID)
            .then(() => {
              let simulationURL = 'esv-private/experiment-view/' + serverID + '/' + experimentID + '/' +
                privateExperiment + '/' + simulation.simulationID;
              resolve(simulationURL);
              ExperimentExecutionService.instance.emit(ExperimentExecutionService.EVENTS.START_EXPERIMENT, undefined);
            })
            .catch(reject);
        })
        .catch(reject);
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
              { state: state }
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
