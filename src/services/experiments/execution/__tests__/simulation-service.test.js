/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import MockAvailableServers from '../../../../mocks/mock_available-servers.json';
import MockSimulations from '../../../../mocks/mock_simulations.json';

import SimulationService from '../../../../services/experiments/execution/simulation-service.js';
import ErrorHandlerService from '../../../error-handler-service';
import { EXPERIMENT_STATE } from '../../../../services/experiments/experiment-constants.js';

jest.setTimeout(10000);

afterEach(() => {
  jest.restoreAllMocks();
});

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new SimulationService();
  }).toThrow(Error);
  expect(() => {
    new SimulationService();
  }).toThrowError(Error('Use SimulationService.instance'));
});

test('the service instance always refers to the same object', () => {
  const instance1 = SimulationService.instance;
  const instance2 = SimulationService.instance;
  expect(instance1).toBe(instance2);
});

test('initializes and gets the simulation resources', async () => {
  let serverBaseURL = MockAvailableServers[0].gzweb['nrp-services'];
  let simID = 1;

  let resources = await SimulationService.instance.initConfigFiles(serverBaseURL, simID);
  expect(resources).toBeDefined();

  // failure case
  jest.spyOn(ErrorHandlerService.instance, 'displayServerHTTPError').mockImplementation(() => { });
  let simIDFailure = 0;
  expect(ErrorHandlerService.instance.displayServerHTTPError).not.toHaveBeenCalled();
  resources = await SimulationService.instance.initConfigFiles(serverBaseURL, simIDFailure);
  expect(ErrorHandlerService.instance.displayServerHTTPError).toHaveBeenCalled();
});

test('verifies whether a simulation is ready', async () => {
  let mockSimulationList = JSON.parse(JSON.stringify(MockSimulations));
  jest.spyOn(SimulationService.instance, 'httpRequestGET').mockImplementation(() => {
    if (SimulationService.instance.httpRequestGET.mock.calls.length === 1) {
      mockSimulationList[0].state = EXPERIMENT_STATE.CREATED; // state pending
    }
    else if (SimulationService.instance.httpRequestGET.mock.calls.length === 2) {
      mockSimulationList[0].state = EXPERIMENT_STATE.PAUSED; // state ok
    }
    else if (SimulationService.instance.httpRequestGET.mock.calls.length === 3) {
      mockSimulationList[0].state = EXPERIMENT_STATE.HALTED; // state bad
    }
    else if (SimulationService.instance.httpRequestGET.mock.calls.length === 4) {
      return Promise.reject('mock simulation GET error'); // general error
    }
    else if (SimulationService.instance.httpRequestGET.mock.calls.length === 5) {
      mockSimulationList[0].state = EXPERIMENT_STATE.PAUSED; // state ok
    }

    return Promise.resolve({
      json: () => {
        return mockSimulationList;
      }
    });
  });

  // call 1 (created) => continue checking & call 2 (paused) => resolved successfully
  let simReady = SimulationService.instance
    .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
  await expect(simReady).resolves.toEqual(mockSimulationList[0]);

  // call 3 (halted) => rejected with state
  simReady = SimulationService.instance
    .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
  await expect(simReady).rejects.toEqual(EXPERIMENT_STATE.HALTED);

  // call 4 (error) => rejected with error
  simReady = SimulationService.instance
    .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
  await expect(simReady).rejects.toEqual('mock simulation GET error');

  // call 5 (state ok but wrong creation id) => rejected because of wrong creation ID
  simReady = SimulationService.instance
    .simulationReady('mock-server-url', 'wrong-creation-id');
  await expect(simReady).rejects.toEqual(undefined);
});