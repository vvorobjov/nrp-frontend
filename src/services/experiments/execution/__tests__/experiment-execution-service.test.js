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
import RunningSimulationService from '../../../../services/experiments/execution/running-simulation-service';
import { EXPERIMENT_STATE } from '../../../../services/experiments/experiment-constants.js';

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
  jest.spyOn(RunningSimulationService.instance, 'registerForRosStatusInformation').mockImplementation();
  let simulationReadyResult = Promise.resolve(MockSimulations[0]);
  jest.spyOn(RunningSimulationService.instance, 'simulationReady').mockImplementation(() => {
    return simulationReadyResult;
  });
  let initConfigFilesResult = Promise.resolve();
  jest.spyOn(RunningSimulationService.instance, 'initConfigFiles').mockImplementation(() => {
    return initConfigFilesResult;
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

  // a failure to init config files should result in a rejection
  let initConfigError = 'init-config-error';
  initConfigFilesResult = Promise.reject(initConfigError);
  await expect(ExperimentExecutionService.instance.launchExperimentOnServer(...callParams))
    .rejects.toEqual(initConfigError);

  // simulation not being ready should result in a rejection
  let simulationReadyError = 'simulation not ready';
  simulationReadyResult = Promise.reject(simulationReadyError);
  await expect(ExperimentExecutionService.instance.launchExperimentOnServer(...callParams))
    .rejects.toEqual(simulationReadyError);
});

test('should be able to stop an experiment', async () => {
  let getStateResult = undefined;
  jest.spyOn(RunningSimulationService.instance, 'getState').mockImplementation(() => {
    return getStateResult;
  });
  let updateStateResult = undefined;
  jest.spyOn(RunningSimulationService.instance, 'updateState').mockImplementation(() => {
    return updateStateResult;
  });

  let simulation = {
    server: 'test-server',
    runningSimulation: {
      simulationID: 'test-sim-id'
    }
  };

  // stop a CREATED simulation
  getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.CREATED });
  updateStateResult = Promise.resolve();
  await ExperimentExecutionService.instance.stopExperiment(simulation);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledTimes(2);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledWith(
    expect.any(String), expect.any(String), { state: EXPERIMENT_STATE.INITIALIZED });
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledWith(
    expect.any(String), expect.any(String), { state: EXPERIMENT_STATE.STOPPED });
  expect(simulation.stopping).toBe(true);

  // stop a STARTED simulation
  RunningSimulationService.instance.updateState.mockClear();
  getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.STARTED });
  await ExperimentExecutionService.instance.stopExperiment(simulation);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledTimes(1);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledWith(
    expect.any(String), expect.any(String), { state: EXPERIMENT_STATE.STOPPED });

  // stop a PAUSED simulation
  RunningSimulationService.instance.updateState.mockClear();
  getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.PAUSED });
  await ExperimentExecutionService.instance.stopExperiment(simulation);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledTimes(1);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledWith(
    expect.any(String), expect.any(String), { state: EXPERIMENT_STATE.STOPPED });

  // stop a HALTED simulation
  RunningSimulationService.instance.updateState.mockClear();
  getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.HALTED });
  await ExperimentExecutionService.instance.stopExperiment(simulation);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledTimes(1);
  expect(RunningSimulationService.instance.updateState).toHaveBeenCalledWith(
    expect.any(String), expect.any(String), { state: EXPERIMENT_STATE.STOPPED });

  // stop a simulation in an undefined state, error
  RunningSimulationService.instance.updateState.mockClear();
  getStateResult = Promise.resolve({ state: undefined });
  await expect(ExperimentExecutionService.instance.stopExperiment(simulation))
    .rejects.toEqual();

  // getState return error
  RunningSimulationService.instance.updateState.mockClear();
  getStateResult = Promise.resolve({});
  await expect(ExperimentExecutionService.instance.stopExperiment(simulation))
    .rejects.toEqual();
});
