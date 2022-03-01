/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import DialogService from '../dialog-service';

import MockDialog from '../../mocks/mock_dialog.json';

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new DialogService();
  }).toThrow(Error);
  expect(() => {
    new DialogService();
  }).toThrowError(Error('Use DialogService.instance'));
});

test('the experiments service instance always refers to the same object', () => {
  const instance1 = DialogService.instance;
  const instance2 = DialogService.instance;
  expect(instance1).toBe(instance2);
});

test('should emit an event on network error', () => {
  jest.spyOn(DialogService.instance, 'networkError').mockImplementation(() => {
    return Promise.resolve();
  });
  let NetworkError = MockDialog;

  let confirmNetworkError = (startingNetwork) => {
    expect(startingNetwork).toEqual(NetworkError);
  };
  DialogService.instance.addListener(
    DialogService.EVENTS.Error,
    confirmNetworkError
  );
  DialogService.instance.networkError(NetworkError.message);
  DialogService.instance.removeListener(
    DialogService.EVENTS.Error,
    confirmNetworkError
  );
});

test('should emit an event on data error', () => {
  jest.spyOn(DialogService.instance, 'dataError').mockImplementation(() => {
    return Promise.resolve();
  });
  let DataError = MockDialog;

  let confirmDataError = (startingData) => {
    expect(startingData).toEqual(DataError);
  };
  DialogService.instance.addListener(
    DialogService.EVENTS.ERROR,
    confirmDataError
  );
  DialogService.instance.dataError(DataError);
  DialogService.instance.removeListener(
    DialogService.EVENTS.ERROR,
    confirmDataError
  );
});

test('should emit an event on simulation error', () => {
  jest.spyOn(DialogService.instance, 'simulationError').mockImplementation(() => {
    return Promise.resolve();
  });
  let SimulationError = MockDialog;

  let confirmSimulationError = (startingSimulation) => {
    expect(startingSimulation).toEqual(SimulationError);
  };
  DialogService.instance.addListener(
    DialogService.EVENTS.ERROR,
    confirmSimulationError
  );
  DialogService.instance.dataError(SimulationError);
  DialogService.instance.removeListener(
    DialogService.EVENTS.ERROR,
    confirmSimulationError
  );
});

test('should emit an event on progress notification', () => {
  jest.spyOn(DialogService.instance, 'info').mockImplementation(() => {
    return Promise.resolve();
  });
  let ProgressNotification = MockDialog;

  let confirmProgressNotification = (startingProgress) => {
    expect(startingProgress).toEqual(ProgressNotification);
  };
  DialogService.instance.addListener(
    DialogService.EVENTS.ERROR,
    confirmProgressNotification
  );
  DialogService.instance.dataError(ProgressNotification);
  DialogService.instance.removeListener(
    DialogService.EVENTS.ERROR,
    confirmProgressNotification
  );
});

test('should emit an event on warning notification', () => {
  jest.spyOn(DialogService.instance, 'warning').mockImplementation(() => {
    return Promise.resolve();
  });
  let WarningNotification = MockDialog;

  let confirmWarningNotification = (startingWarning) => {
    expect(startingWarning).toEqual(WarningNotification);
  };

  DialogService.instance.addListener(
    DialogService.EVENTS.ERROR,
    confirmWarningNotification
  );
  DialogService.instance.dataError(WarningNotification);
  DialogService.instance.removeListener(
    DialogService.EVENTS.ERROR,
    confirmWarningNotification
  );
});
