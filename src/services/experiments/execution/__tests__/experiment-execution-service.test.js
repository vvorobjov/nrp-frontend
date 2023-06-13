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
import SimulationService from '../../../../services/experiments/execution/running-simulation-service';
import ServerResourcesService from '../../../../services/experiments/execution/server-resources-service';
import { EXPERIMENT_STATE } from '../../../../services/experiments/experiment-constants.js';
import config from '../../../../config.json';

jest.mock('../../../authentication-service.js');
//jest.setTimeout(10000);

beforeEach(() => {
  //jest.genMockFromModule('AuthenticationService');
  //jest.mock('AuthenticationService');
  if (config.auth.enableOIDC) {
    jest.mock('../../../authentication-service.js');
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ExperimentExecutionService', () => {

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
    ServerResourcesService.instance.availableServers = MockAvailableServers;
    jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation((server) =>{
      if (server===MockAvailableServers[-1]) {
        return Promise.resolve();
      }
      else {
        return Promise.reject();
      }
    }
    );
    let properServerID;

    jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(
      // only the last server in the list will return a successful launch
      (id,privateparam,configFile,serverID,serverConfig, progressCallback) => {
        properServerID = serverID;
        return Promise.resolve();
      }
    );
    let experiment = MockExperiments[0];
    ExperimentExecutionService.instance.startNewExperiment(experiment).then(() => {
      MockAvailableServers.forEach(server => {
        expect(ServerResourcesService.instance.getServerConfig).toHaveBeenCalledWith(server.id);
      });
      expect(properServerID).toBe(MockAvailableServers[-1]);
      done();
    });
  });

  test('starting an experiment should abort early if a fatal error occurs', async () => {
    jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(
      () => {
        return Promise.reject({ isFatal: true });
      }
    );
    jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation(() => {
      return Promise.resolve();
    });

    let experiment = MockExperiments[0];
    await expect(ExperimentExecutionService.instance.startNewExperiment(experiment)).rejects
      .toMatch(ExperimentExecutionService.ERRORS.LAUNCH_FATAL_ERROR);
  });

  test('starting an experiment should fail if no server is ready', async () => {
    jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(() => {
      return Promise.reject({});
    });
    jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation(() => {
      return Promise.reject();
    });

    let experiment = MockExperiments[0];
    await expect(ExperimentExecutionService.instance.startNewExperiment(experiment)).rejects
      .toMatch(ExperimentExecutionService.ERRORS.LAUNCH_NO_SERVERS_LEFT);
  });

  test('respects settings for specific dev server to launch and single brain process mode', async () => {
    jest.spyOn(ExperimentExecutionService.instance, 'launchExperimentOnServer').mockImplementation(() => {
      return Promise.resolve();
    });
    jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation(() => {
      return Promise.resolve();
    });

    let mockExperiment = {
      id: 'test-experiment-id',
      devServer: 'test-dev-server-url',
      configuration: {
        configFile: 'test_config.json'
      }
    };
    await ExperimentExecutionService.instance.startNewExperiment(mockExperiment, true);
    expect(ExperimentExecutionService.instance.launchExperimentOnServer).toHaveBeenCalledWith(
      mockExperiment.id,
      undefined,
      mockExperiment.configuration.configFile,
      mockExperiment.devServer,
      undefined,
      expect.any(Function)
    );
  });

  test('can launch an experiment given a specific server + configuration', async () => {
    let simulationReadyResult = Promise.resolve(MockSimulations[0]);
    jest.spyOn(ExperimentExecutionService.instance, 'httpRequestPOST').mockImplementation(() => {
      return simulationReadyResult;
    });

    let experimentID = 'test-experiment-id';
    let privateExperiment = true;
    let configFile = 'simulation_config.json';
    let serverID = 'test-server-id';
    let serverConfiguration = MockServerConfig;
    let progressCallback = jest.fn();
    let callParams = [experimentID, privateExperiment, configFile, serverID, serverConfiguration,
      progressCallback];

    await ExperimentExecutionService.instance.launchExperimentOnServer(...callParams);
    expect(ExperimentExecutionService.instance.httpRequestPOST)
      .toHaveBeenLastCalledWith(serverConfiguration['nrp-services'] + '/simulation', expect.any(String));

    // simulation not being ready should result in a rejection
    let simulationReadyError = 'simulation not ready';
    simulationReadyResult = Promise.reject(simulationReadyError);
    await expect(ExperimentExecutionService.instance.launchExperimentOnServer(...callParams))
      .rejects.toEqual(simulationReadyError);
  });

  test('should be able to stop an experiment', async () => {
    let getStateResult = undefined;
    jest.spyOn(SimulationService.instance, 'getState').mockImplementation(() => {
      return getStateResult;
    });
    let updateStateResult = undefined;
    jest.spyOn(SimulationService.instance, 'updateState').mockImplementation(() => {
      return updateStateResult;
    });
    jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation(async () => {
      return MockServerConfig;
    });
    let simulation = {
      server: 'test-server',
      runningSimulation: {
        simulationID: 'test-sim-id'
      }
    };

    // shutdown a STARTED simulation
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.STARTED });
    await ExperimentExecutionService.instance.shutdownExperiment(simulation);
    expect(SimulationService.instance.updateState).toHaveBeenCalledTimes(1);
    expect(SimulationService.instance.updateState).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), EXPERIMENT_STATE.STOPPED);

    // shutdown a PAUSED simulation
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.PAUSED });
    await ExperimentExecutionService.instance.shutdownExperiment(simulation);
    expect(SimulationService.instance.updateState).toHaveBeenCalledTimes(1);
    expect(SimulationService.instance.updateState).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), EXPERIMENT_STATE.STOPPED);

    // shutdown a STOPPED simulation
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.STOPPED });
    await ExperimentExecutionService.instance.shutdownExperiment(simulation);
    expect(SimulationService.instance.updateState).toHaveBeenCalledTimes(1);
    expect(SimulationService.instance.updateState).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), EXPERIMENT_STATE.STOPPED);

    // shutdown a FAILED simulation
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({ state: EXPERIMENT_STATE.FAILED });
    await expect(ExperimentExecutionService.instance.shutdownExperiment(simulation))
      .rejects.toEqual();
    expect(SimulationService.instance.updateState).toHaveBeenCalledTimes(0);

    // shutdown a simulation in an undefined state, error
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({ state: undefined });
    await expect(ExperimentExecutionService.instance.shutdownExperiment(simulation))
      .rejects.toEqual();

    // getState return error
    SimulationService.instance.updateState.mockClear();
    getStateResult = Promise.resolve({});
    await expect(ExperimentExecutionService.instance.shutdownExperiment(simulation))
      .rejects.toEqual();
  });
});
