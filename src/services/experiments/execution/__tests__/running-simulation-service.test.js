/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import MockSimulations from '../../../../mocks/mock_simulations.json';

import RunningSimulationService from '../running-simulation-service.js';
import DialogService from '../../../dialog-service';
import { EXPERIMENT_STATE } from '../../experiment-constants.js';

jest.setTimeout(10000);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RunningSimulationService', () => {

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
    // The legacy suite drove state transitions with EXPERIMENT_STATE.HALTED /
    // .INITIALIZED, which do not exist in EXPERIMENT_STATE (both undefined), so
    // the "bad state" leg wrongly matched the ready branch. Use real states:
    // CREATED (pending) -> PAUSED (ready) and FAILED for the terminal reject.
    jest.spyOn(RunningSimulationService.instance, 'httpRequestGET').mockImplementation(() => {
      const call = RunningSimulationService.instance.httpRequestGET.mock.calls.length;
      if (call === 1) {
        mockSimulationList[0].state = EXPERIMENT_STATE.CREATED; // state pending
      }
      else if (call === 3) {
        mockSimulationList[0].state = EXPERIMENT_STATE.FAILED; // terminal state
      }
      else if (call === 4) {
        return Promise.reject('mock simulation GET error'); // general error
      }
      else {
        mockSimulationList[0].state = EXPERIMENT_STATE.PAUSED; // state ok
      }

      return Promise.resolve({
        json: () => {
          return mockSimulationList;
        }
      });
    });

    // A tiny interval keeps the polling loop fast and deterministic.
    const options = { interval: 1, maxAttempts: 10 };

    // call 1 (created) => continue checking & call 2 (paused) => resolved successfully
    let simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID, options);
    await expect(simReady).resolves.toEqual(mockSimulationList[0]);

    // call 3 (failed) => rejected with the terminal state
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID, options);
    await expect(simReady).rejects.toEqual(EXPERIMENT_STATE.FAILED);

    // call 4 (error) => rejected with error
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', mockSimulationList[0].creationUniqueID, options);
    await expect(simReady).rejects.toEqual('mock simulation GET error');

    // call 5 (state ok but wrong creation id) => rejected because of wrong creation ID
    // EBR2-108: a mismatch is now a terminal Error, not a silent undefined reject.
    simReady = RunningSimulationService.instance
      .simulationReady('mock-server-url', 'wrong-creation-id', options);
    await expect(simReady).rejects.toThrow('creationUniqueID mismatch');
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
    let returnValuePUT = { state: EXPERIMENT_STATE.PAUSED };
    jest.spyOn(DialogService.instance, 'simulationError').mockImplementation();
    // updateState issues a PUT and returns the parsed body, so the mock must key
    // off httpRequestPUT (the previous httpRequestGET.mock reference threw) and
    // hand back a Response-like object exposing json().
    jest.spyOn(RunningSimulationService.instance, 'httpRequestPUT').mockImplementation(() => {
      if (RunningSimulationService.instance.httpRequestPUT.mock.calls.length === 1) {
        return Promise.resolve({ json: () => returnValuePUT });
      }
      return Promise.reject();
    });

    // call 1 => proper return
    let returnValue = await RunningSimulationService.instance.updateState('test-url', 1, EXPERIMENT_STATE.PAUSED);
    expect(returnValue).toBe(returnValuePUT);

    // call 2 => rejected => error surfaced and a FAILED state returned
    returnValue = await RunningSimulationService.instance.updateState('test-url', 1, EXPERIMENT_STATE.PAUSED);
    expect(DialogService.instance.simulationError).toHaveBeenCalled();
    expect(returnValue).toEqual({ state: EXPERIMENT_STATE.FAILED });
  });
});

// EBR2-108: simulationReady used to poll forever after a creationUniqueID
// mismatch (it rejected but kept re-scheduling) and had no upper bound. This
// suite covers the bounded/bailout behavior. A tiny interval and small
// maxAttempts keep the tests fast and deterministic.
describe('RunningSimulationService.simulationReady bailouts (EBR2-108)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('rejects and stops polling on a creationUniqueID mismatch', async () => {
    const getSpy = jest.spyOn(RunningSimulationService.instance, 'httpRequestGET')
      .mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve([
          { state: EXPERIMENT_STATE.PAUSED, creationUniqueID: 'real-id' }
        ])
      }));

    await expect(
      RunningSimulationService.instance.simulationReady(
        'mock-server-url', 'wrong-id', { interval: 1, maxAttempts: 10 })
    ).rejects.toThrow('creationUniqueID mismatch');

    // A mismatch is terminal: the poll must not be re-scheduled.
    const callsAfterReject = getSpy.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getSpy.mock.calls.length).toBe(callsAfterReject);
    expect(callsAfterReject).toBe(1);
  });

  test('rejects with a timeout after maxAttempts while stuck pending', async () => {
    const getSpy = jest.spyOn(RunningSimulationService.instance, 'httpRequestGET')
      .mockImplementation(() => Promise.resolve({
        json: () => Promise.resolve([
          { state: EXPERIMENT_STATE.CREATED, creationUniqueID: 'real-id' }
        ])
      }));

    await expect(
      RunningSimulationService.instance.simulationReady(
        'mock-server-url', 'real-id', { interval: 1, maxAttempts: 3 })
    ).rejects.toThrow('Timed out');

    expect(getSpy.mock.calls.length).toBe(3);
  });
});