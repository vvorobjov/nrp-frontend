/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import MockServerconfig from '../../../../mocks/mock_server-config.json';

import ServerResourcesService from '../../../../services/experiments/execution/server-resources-service';
import DialogService from '../../../error-handler-service';

jest.setTimeout(10000);

let onWindowBeforeUnloadCb = undefined;
beforeEach(() => {
  jest.spyOn(window, 'addEventListener').mockImplementation((event, cb) => {
    if (event === 'beforeunload') {
      onWindowBeforeUnloadCb = cb;
    }
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ServerResourcesService();
  }).toThrow(Error);
  expect(() => {
    new ServerResourcesService();
  }).toThrowError(Error('Use ServerResourcesService.instance'));
});

test('the service instance always refers to the same object', () => {
  const instance1 = ServerResourcesService.instance;
  const instance2 = ServerResourcesService.instance;
  expect(instance1).toBe(instance2);
});

test('does automatic poll updates for server availability', (done) => {
  jest.spyOn(ServerResourcesService.instance, 'getServerAvailability');

  // check that getExperiments is periodically called after poll interval
  let numCallsServerAvailabilityT0 = ServerResourcesService.instance.getServerAvailability.mock.calls.length;
  setTimeout(() => {
    let numCallsServerAvailabilityT1 = ServerResourcesService.instance.getServerAvailability.mock.calls.length;
    expect(numCallsServerAvailabilityT1 > numCallsServerAvailabilityT0).toBe(true);

    // stop updates and check that no more calls occur after poll interval
    ServerResourcesService.instance.stopUpdates();
    setTimeout(() => {
      let numCallsServerAvailabilityT2 = ServerResourcesService.instance.getServerAvailability.mock.calls.length;
      expect(numCallsServerAvailabilityT2 === numCallsServerAvailabilityT1).toBe(true);
      done();
    }, ServerResourcesService.CONSTANTS.INTERVAL_POLL_SERVER_AVAILABILITY);
  }, ServerResourcesService.CONSTANTS.INTERVAL_POLL_SERVER_AVAILABILITY);
});

test('can get a server config', async () => {
  // regular call with proper json
  let config = await ServerResourcesService.instance.getServerConfig('test-server-id');
  expect(config).toEqual(MockServerconfig);

  // rejected promise on GET
  jest.spyOn(ServerResourcesService.instance, 'httpRequestGET').mockImplementation(() => {
    return Promise.reject();
  });
  jest.spyOn(DialogService.instance, 'networkError').mockImplementation();
  config = await ServerResourcesService.instance.getServerConfig('test-server-id');
  expect(DialogService.instance.networkError).toHaveBeenCalled();
});

test('should stop polling updates when window is unloaded', async () => {
  let service = ServerResourcesService.instance;
  expect(onWindowBeforeUnloadCb).toBeDefined();

  jest.spyOn(service, 'stopUpdates');
  onWindowBeforeUnloadCb({});
  expect(service.stopUpdates).toHaveBeenCalled();
});
