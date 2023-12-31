/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import MockAvailableServers from '../../../../mocks/mock_available-servers.json';
import MockSimulations from '../../../../mocks/mock_simulations.json';

import RunningSimulationService from '../running-simulation-service.js';
import DialogService from '../../../dialog-service';
import RoslibService from '../../../roslib-service';
import { EXPERIMENT_STATE } from '../../experiment-constants.js';

jest.setTimeout(10000);

afterEach(() => {
  jest.restoreAllMocks();
});

describe.skip('RunningSimulationService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new RunningSimulationService();
    }).toThrow(Error);
    expect(() => {
      new RunningSimulationService();
    }).toThrowError(Error('Use SimulationService.instance'));
  });

  test('the service instance always refers to the same object', () => {
    const instance1 = RunningSimulationService.instance;
    const instance2 = RunningSimulationService.instance;
    expect(instance1).toBe(instance2);
  });

  test('verifies whether a simulation is ready', async () => {
    let mockSimulationList = JSON.parse(JSON.stringify(MockSimulations));
    jest.spyOn(RunningSimulationService.instance, 'httpRequestGET').mockImplementation(() => {
      if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 1) {
        mockSimulationList[0].state = EXPERIMENT_STATE.CREATED; // state pending
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 2) {
        mockSimulationList[0].state = EXPERIMENT_STATE.PAUSED; // state ok
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 3) {
        mockSimulationList[0].state = EXPERIMENT_STATE.HALTED; // state bad
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 4) {
        return Promise.reject('mock simulation GET error'); // general error
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 5) {
        mockSimulationList[0].state = EXPERIMENT_STATE.PAUSED; // state ok
      }

      return Promise.resolve({
        json: () => {
          return mockSimulationList;
        }
      });
    });

    // call 1 (created) => continue checking & call 2 (paused) => resolved successfully
    let simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
    await expect(simReady).resolves.toEqual(mockSimulationList[0]);

    // call 3 (halted) => rejected with state
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
    await expect(simReady).rejects.toEqual(EXPERIMENT_STATE.HALTED);

    // call 4 (error) => rejected with error
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID);
    await expect(simReady).rejects.toEqual('mock simulation GET error');

    // call 5 (state ok but wrong creation id) => rejected because of wrong creation ID
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', 'wrong-creation-id');
    await expect(simReady).rejects.toEqual(undefined);
  });

  test('can retrieve the state of a simulation', async () => {
    let returnValueGET = undefined;
    jest.spyOn(DialogService.instance, 'networkError').mockImplementation();
    jest.spyOn(RunningSimulationService.instance, 'httpRequestGET').mockImplementation(() => {
      if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 1) {
        returnValueGET = { state: EXPERIMENT_STATE.PAUSED }; // proper state msg
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 2) {
        return Promise.reject();
      }

      return Promise.resolve({
        json: () => {
          return returnValueGET;
        }
      });
    });

    // call 1 => proper return
    let simSate = await RunningSimulationService.instance.getState('test-url', 1);
    expect(simSate).toBe(returnValueGET);

    // call 2 => rejected
    simSate = await RunningSimulationService.instance.getState('test-url', 1);
    expect(DialogService.instance.networkError).toHaveBeenCalled();
  });

  test('can set the state of a simulation', async () => {
    let returnValuePUT = undefined;
    jest.spyOn(DialogService.instance, 'simulationError').mockImplementation();
    jest.spyOn(RunningSimulationService.instance, 'httpRequestPUT').mockImplementation(() => {
      if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 1) {
        returnValuePUT = {};
      }
      else if (RunningSimulationService.instance.httpRequestGET.mock.calls.length === 2) {
        return Promise.reject();
      }

      return Promise.resolve(returnValuePUT);
    });

    // call 1 => proper return
    let returnValue = await RunningSimulationService.instance.updateState('test-url', 1, EXPERIMENT_STATE.PAUSED);
    expect(returnValue).toBe(returnValuePUT);

    // call 2 => rejected
    returnValue = await RunningSimulationService.instance.updateState('test-url', 1, EXPERIMENT_STATE.PAUSED);
    expect(DialogService.instance.simulationError).toHaveBeenCalled();
  });
});