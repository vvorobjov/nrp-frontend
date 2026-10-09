/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import DialogService from '../../../services/dialog-service';
import ExperimentWorkbenchService from '../experiment-workbench-service';
import { EXPERIMENT_STATE } from '../../../services/experiments/experiment-constants';
import { ExperimentWorkbench } from '../experiment-workbench';

// The MQTT client connects to a broker as soon as its singleton is created;
// the workbench constructor asks it for the connection state and the
// workbench service (un)subscribes topics when simulationInfo changes.
// (jest.mock is hoisted above the imports by babel-jest.)
jest.mock('../../../services/mqtt-client-service', () => ({
  __esModule: true,
  default: {
    instance: {
      getConnectionState: () => 'disconnected',
      isConnected: () => false,
      getConfig: () => ({ mqtt: { topics: {} } }),
      subscribeToTopic: jest.fn(() => 'token'),
      unsubscribe: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}));

// Regression guard for EBR2-130: the status popup read this.state right after
// setState, so it announced the previous state ("The experiment is paused"
// after pressing play). React applies setState later, so the test keeps it
// deferred: setState records the call and leaves this.state untouched.
describe('ExperimentWorkbench.updateSimulationStatus (EBR2-130)', () => {
  let workbench;
  let progressNotification;

  beforeEach(() => {
    workbench = new ExperimentWorkbench({ params: { experimentID: 'husky_braitenberg_0' } });
    workbench.setState = jest.fn();
    progressNotification = jest
      .spyOn(DialogService.instance, 'progressNotification')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('announces the incoming state, not the one still in this.state', async () => {
    expect(workbench.state.simulationState).toBe(EXPERIMENT_STATE.UNDEFINED);

    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.STARTED });

    expect(progressNotification).toHaveBeenCalledTimes(1);
    expect(progressNotification).toHaveBeenCalledWith({ message: 'The experiment is running' });
    expect(workbench.setState).toHaveBeenCalledWith(
      expect.objectContaining({ simulationState: EXPERIMENT_STATE.STARTED, simStateLoading: false })
    );
  });

  it('uses the human label for every state', async () => {
    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.PAUSED });
    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.COMPLETED });

    expect(progressNotification.mock.calls.map(([n]) => n.message)).toEqual([
      'The experiment is paused',
      'The experiment is completed'
    ]);
  });

  it('clears the running simulation on the transition into a final state', async () => {
    // Bypass the setter: it would subscribe MQTT topics for the simulation.
    ExperimentWorkbenchService.instance._simulationInfo = { ID: 3 };

    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.FAILED });

    expect(progressNotification).toHaveBeenCalledWith({ message: 'The experiment is failed' });
    expect(ExperimentWorkbenchService.instance.simulationInfo).toBeUndefined();
    expect(workbench.setState).toHaveBeenCalledWith({ runningSimulationID: undefined });
  });

  it('ignores a repeated state and the stopped state', async () => {
    workbench.state.simulationState = EXPERIMENT_STATE.STARTED;

    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.STARTED });
    await workbench.updateSimulationStatus({ state: EXPERIMENT_STATE.STOPPED });

    expect(progressNotification).not.toHaveBeenCalled();
    expect(workbench.setState).not.toHaveBeenCalled();
  });
});
