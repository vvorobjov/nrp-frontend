import _ from 'lodash';

import NrpAnalyticsService from '../../nrp-analytics-service.js';
import ExperimentServerService from './experiment-server-service.js';
import { HttpService } from '../../http-service.js';

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

    this.startingExperiment = experiment;

    console.info(ExperimentServerService.instance.getServerAvailability(true));
    let fatalErrorOccurred = false,
      serversToTry = experiment.devServer
        ? [experiment.devServer]
        : ExperimentServerService.instance.getServerAvailability(true).map(s => s.id);

    let brainProcesses = launchSingleMode ? 1 : experiment.configuration.brainProcesses;

    //TODO: placeholder, register actual progress callback later
    let progressCallback = (msg) => {
      console.info(msg);
    };

    let launchInNextServer = async () => {
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

        return launchInNextServer();
      });
    };

    return launchInNextServer();
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
              resolve(
                'esv-private/experiment-view/' +
                  server +
                  '/' +
                  experimentID +
                  '/' +
                  privateExperiment +
                  '/' +
                  simulation.simulationID
              );
              this.startingExperiment = undefined;
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  };
}

export default ExperimentExecutionService;
