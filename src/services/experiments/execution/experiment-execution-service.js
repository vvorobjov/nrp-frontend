import _ from 'lodash';

import NrpAnalyticsService from '../../nrp-analytics-service.js';
import ExperimentServerService from './experiment-server-service.js';
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
  startNewExperiment(
    experiment,
    launchSingleMode,
    reservation,
    playbackRecording,
    profiler
  ) {
    NrpAnalyticsService.instance.eventTrack('Start', { category: 'Experiment' });
    NrpAnalyticsService.instance.tickDurationEvent('Server-initialization');

    ExperimentExecutionService.instance.emit(ExperimentExecutionService.EVENTS.START_EXPERIMENT, experiment);

    let fatalErrorOccurred = false;
    let serversToTry = experiment.devServer
      ? [experiment.devServer]
      : ExperimentServerService.instance.getServerAvailability(true).map(s => s.id);

    let brainProcesses = launchSingleMode ? 1 : experiment.configuration.brainProcesses;

    //TODO: placeholder, register actual progress callback later
    let progressCallback = (msg) => {
      console.info(msg);
    };

    let launchOnNextServer = async () => {
      let nextServer = serversToTry.splice(0, 1);
      if (fatalErrorOccurred || !nextServer.length) {
        //no more servers to retry, we have failed to start experiment
        return Promise.reject(fatalErrorOccurred);
      }

      let server = nextServer[0];
      let serverConfig = await ExperimentServerService.instance.getServerConfig(server);

      return await this.launchExperimentOnServer(
        experiment.id,
        experiment.private,
        brainProcesses,
        server,
        serverConfig,
        reservation,
        playbackRecording,
        profiler,
        progressCallback
      ).catch((failure) => {
        if (failure.error && failure.error.data) {
          console.error('Failed to start simulation: ' + JSON.stringify(failure.error.data));
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
   * @param {string} server - server ID
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
    server,
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
      ExperimentServerService.instance.registerForRosStatusInformation(
        serverConfiguration.rosbridge.websocket,
        progressCallback
      );

      ExperimentServerService.instance.simulationReady(serverURL, simInitData.creationUniqueID)
        .then((simulation) => {
          ExperimentServerService.instance.initConfigFiles(serverURL, simulation.simulationID)
            .then(() => {
              ExperimentExecutionService.instance.emit(ExperimentExecutionService.EVENTS.START_EXPERIMENT, undefined);
              let simulationURL = 'esv-private/experiment-view/' + server + '/' + experimentID + '/' +
                privateExperiment + '/' + simulation.simulationID;
              resolve(simulationURL);
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

      ExperimentServerService.instance
        .getServerConfig(simulation.server)
        .then((serverConfig) => {
          let serverURL = serverConfig.gzweb['nrp-services'];
          let simulationID = simulation.runningSimulation.simulationID;

          function updateSimulationState(state) {
            /*eslint-disable camelcase*/
            return ExperimentServerService.instance.updateSimulationState(
              serverURL,
              simulationID,
              { state: state }
            );
          }

          return ExperimentServerService.instance
            .getSimulationState(serverURL, simulationID)
            .then((data) => {
              if (!data || !data.state) {
                return Promise.reject();
              }
              switch (data.state) {
              case EXPERIMENT_STATE.CREATED: //CREATED --(initialize)--> PAUSED --(stop)--> STOPPED
                return updateSimulationState(EXPERIMENT_STATE.INITIALIZED).then(
                  _.partial(updateSimulationState, EXPERIMENT_STATE.STOPPED)
                );
              case EXPERIMENT_STATE.STARTED: //STARTED --(stop)--> STOPPED
              case EXPERIMENT_STATE.PAUSED: //PAUSED  --(stop)--> STOPPED
              case EXPERIMENT_STATE.HALTED: //HALTED  --(stop)--> FAILED
                return updateSimulationState(EXPERIMENT_STATE.STOPPED);
              default:
                return Promise.reject();
              }
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

export default ExperimentExecutionService;
