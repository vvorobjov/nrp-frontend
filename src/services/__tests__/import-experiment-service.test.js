/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ErrorHandlerService from '../error-handler-service';

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ErrorHandlerService();
  }).toThrow(Error);
  expect(() => {
    new ErrorHandlerService();
  }).toThrowError(Error('Use ErrorHandlerService.instance'));
});

test('the experiments service instance always refers to the same object', () => {
  const instance1 = ErrorHandlerService.instance;
  const instance2 = ErrorHandlerService.instance;
  expect(instance1).toBe(instance2);
});

test('should emit an event on network error', () => {
  jest.spyOn(ErrorHandlerService.instance, 'networkError').mockImplementation(() => {
    return Promise.resolve();
  });
  let NetworkError = MockNetworkError;
  ErrorHandlerService.instance.addListener(
    ErrorHandlerService.EVENTS.Error,
    confirmStartingExperiment
  );
  await ErrorHandlerService.instance.networkError(NetworkError);
  ErrorHandlerService.instance.removeListener(
    ErrorHandlerService.EVENTS.Error,
    confirmStartingExperiment
  );
});

test('should emit an event on data error', () => {
  jest.spyOn(ErrorHandlerService.instance, 'dataError').mockImplementation(() => {
    return Promise.resolve();
  });
  let DataError = DataNetworkError;
  ErrorHandlerService.instance.addListener(
    ErrorHandlerService.EVENTS.ERROR,
    confirmStartingExperiment
  );
  await ErrorHandlerService.instance.dataError(NetworkError);
  ErrorHandlerService.instance.removeListener(
    ErrorHandlerService.EVENTS.ERROR,
    confirmStartingExperiment
  );
});
