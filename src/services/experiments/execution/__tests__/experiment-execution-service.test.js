/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import MockExperiments from '../../../../mocks/mock_experiments.json';
import MockAvailableServers from '../../../../mocks/mock_available-servers.json';
import MockServerConfig from '../../../../mocks/mock_server-config.json';
import MockSimulations from '../../../../mocks/mock_simulations.json';

import ExperimentExecutionService from '../../../../services/experiments/execution/experiment-execution-service';
import ServerResourcesService from '../../../../services/experiments/execution/server-resources-service';
import SimulationService from '../../../../services/experiments/execution/simulation-service';

//jest.setTimeout(10000);

afterEach(() => {
  jest.restoreAllMocks();
});

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ExperimentExecutionService();
  }).toThrow(Error);
  expect(() => {
    new ExperimentExecutionService();
  }).toThrowError(Error('Use ExperimentExecutionService.instance'));
});

test('the service instance always refers to the same object', () => {
  const instance1 = ExperimentExecutionService.instance;
  const instance2 = ExperimentExecutionService.instance;
  expect(instance1).toBe(instance2);
});

test('should emit an event on starting an experiment', async () => {
  jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(() => {
    return Promise.resolve();
  });
  let experiment = MockExperiments[0];

  let confirmStartingExperiment = (startingExperiment) => {
    expect(startingExperiment).toEqual(experiment);
  };
  ExperimentExecutionService.instance.addListener(
    ExperimentExecutionService.EVENTS.START_EXPERIMENT,
    confirmStartingExperiment
  );
  await ExperimentExecutionService.instance.startNewExperiment(experiment);
  ExperimentExecutionService.instance.removeListener(
    ExperimentExecutionService.EVENTS.START_EXPERIMENT,
    confirmStartingExperiment
  );
});

test('should go through the list of available servers when trying to start an experiment', (done) => {
  jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(ServerResourcesService.instance, 'getServerConfig');
  jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(
    // only the last server in the list will return a successful launch
    (expID, isPrivate, numBrainProc, serverID) => {
      if (serverID !== MockAvailableServers[MockAvailableServers.length - 1].id) {
        return Promise.reject({
          error: {
            data: 'test rejection for launch on server ' + serverID
          }
        });
      }

      return Promise.resolve();
    }
  );

  let experiment = MockExperiments[0];
  ExperimentExecutionService.instance.startNewExperiment(experiment).then(() => {
    MockAvailableServers.forEach(server => {
      expect(ServerResourcesService.instance.getServerConfig).toHaveBeenCalledWith(server.id);
    });
    expect(console.error).toHaveBeenCalled();
    done();
  });
});

test('starting an experiment should abort early if a fatal error occurs', (done) => {
  jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(
    () => {
      return Promise.reject({
        isFatal: true
      });
    }
  );

  let experiment = MockExperiments[0];
  ExperimentExecutionService.instance.startNewExperiment(experiment).catch(error => {
    expect(error).toEqual(ExperimentExecutionService.ERRORS.LAUNCH_FATAL_ERROR);
    done();
  });
});

test('starting an experiment should fail if no server is ready', (done) => {
  jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(
    () => {
      return Promise.reject({});
    }
  );

  let experiment = MockExperiments[0];
  ExperimentExecutionService.instance.startNewExperiment(experiment).catch(error => {
    expect(error).toEqual(ExperimentExecutionService.ERRORS.LAUNCH_NO_SERVERS_LEFT);
    done();
  });
});

test('respects settings for specific dev server to launch and single brain process mode', async () => {
  jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(() => {
    return Promise.resolve();
  });

  let mockExperiment = {
    id: 'test-experiment-id',
    devServer: 'test-dev-server-url'
  };
  await ExperimentExecutionService.instance.startNewExperiment(mockExperiment, true);
  expect(ExperimentExecutionService.instance.launchExperimentOnServer).toHaveBeenCalledWith(
    mockExperiment.id,
    undefined,
    1,
    mockExperiment.devServer,
    expect.any(Object),
    undefined,
    undefined,
    undefined,
    expect.any(Function)
  );
});

test('can launch an experiment given a specific server + configuration', async () => {
  jest.spyOn(ExperimentExecutionService.instance, 'httpRequestPOST').mockImplementation();
  jest.spyOn(SimulationService.instance, 'registerForRosStatusInformation').mockImplementation();
  jest.spyOn(SimulationService.instance, 'simulationReady').mockImplementation(() => {
    return Promise.resolve(MockSimulations[0]);
  });
  jest.spyOn(SimulationService.instance, 'initConfigFiles').mockImplementation(() => {
    return Promise.resolve();
  });

  let experimentID = 'test-experiment-id';
  let privateExperiment = true;
  let brainProcesses = 2;
  let serverID = 'test-server-id';
  let serverConfiguration = MockServerConfig;
  let reservation = {};
  let playbackRecording = {};
  let profiler = {};
  let progressCallback = jest.fn();
  let callParams = [experimentID, privateExperiment, brainProcesses, serverID, serverConfiguration, reservation,
    playbackRecording, profiler, progressCallback];

  let result = await ExperimentExecutionService.instance.launchExperimentOnServer(...callParams);
  expect(ExperimentExecutionService.instance.httpRequestPOST)
    .toHaveBeenLastCalledWith(serverConfiguration.gzweb['nrp-services'] + '/simulation', expect.any(String));
  expect(progressCallback).toHaveBeenCalled();
  expect(result).toBe('esv-private/experiment-view/' + serverID + '/' + experimentID + '/' +
  privateExperiment + '/' + MockSimulations[0].simulationID);
});
