/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ExperimentStorageService from '../experiment-storage-service';
import endpoints from '../../../proxy/data/endpoints.json';
import config from '../../../../config.json';
import MockExperiments from '../../../../mocks/mock_experiments.json';
jest.mock('../../../authentication-service');

const proxyEndpoint = endpoints.proxy;
const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.storage.experiments.url}`;

jest.setTimeout(3 * ExperimentStorageService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);

afterEach(() => {
  jest.restoreAllMocks();
});

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ExperimentStorageService();
  }).toThrow(Error);
  expect(() => {
    new ExperimentStorageService();
  }).toThrowError(Error('Use ExperimentStorageService.instance'));
});

test('the experiments service instance always refers to the same object', () => {
  const instance1 = ExperimentStorageService.instance;
  const instance2 = ExperimentStorageService.instance;
  expect(instance1).toBe(instance2);
});

test('fetches the list of experiments', async () => {
  jest.spyOn(ExperimentStorageService.instance, 'performRequest');

  const experiments = await ExperimentStorageService.instance.getExperiments();
  expect(ExperimentStorageService.instance.performRequest)
    .toHaveBeenCalledWith(experimentsUrl, ExperimentStorageService.instance.options);
  expect(experiments[0].name).toBe('braitenberg_husky_holodeck_1_0_0');
  expect(experiments[1].configuration.maturity).toBe('production');

  // no forced update should not result in additional requests being sent
  let oldCallCount = ExperimentStorageService.instance.performRequest.mock.calls.length;
  await ExperimentStorageService.instance.getExperiments();
  expect(ExperimentStorageService.instance.performRequest.mock.calls.length).toBe(oldCallCount);

  // forced update should result in new request
  await ExperimentStorageService.instance.getExperiments(true);
  expect(ExperimentStorageService.instance.performRequest.mock.calls.length).toBe(oldCallCount + 1);
});

test('emits an event when updating the experiment list', async () => {
  let onUpdateExperiments = jest.fn();
  ExperimentStorageService.instance.addListener(
    ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS, onUpdateExperiments);
  await ExperimentStorageService.instance.getExperiments(true);
  expect(onUpdateExperiments).toHaveBeenCalled();
  ExperimentStorageService.instance.removeListener(
    ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS, onUpdateExperiments);
});

test('does automatic poll updates of experiment list which can be stopped', (done) => {
  jest.spyOn(ExperimentStorageService.instance, 'getExperiments');

  // check that getExperiments is periodically called after poll interval
  let numCallsT0 = ExperimentStorageService.instance.getExperiments.mock.calls.length;
  setTimeout(() => {
    let numCallsT1 = ExperimentStorageService.instance.getExperiments.mock.calls.length;
    expect(numCallsT1 > numCallsT0).toBe(true);

    // stop updates and check that no more calls occur after poll interval
    ExperimentStorageService.instance.stopUpdates();
    setTimeout(() => {
      let numCallsT2 = ExperimentStorageService.instance.getExperiments.mock.calls.length;
      expect(numCallsT2 === numCallsT1).toBe(true);
      done();
    }, ExperimentStorageService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);
  }, ExperimentStorageService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);
});

test('gets a thumbnail image for experiments', async () => {
  let experiment = MockExperiments[0];
  const imageBlob = await ExperimentStorageService.instance.getThumbnail(experiment.name,
    experiment.configuration.thumbnail);
  expect(imageBlob).toBeDefined();
});

test('sorts the local experiment list by display name', async () => {
  let mockExperimentList = [
    {
      configuration: { name: 'bcd' }
    },
    {
      configuration: { name: 'Abc' }
    }
  ];
  ExperimentStorageService.instance.experiments = mockExperimentList;
  ExperimentStorageService.instance.sortExperiments();
  expect(mockExperimentList[0].configuration.name).toBe('Abc');
  expect(mockExperimentList[1].configuration.name).toBe('bcd');
});

test('fills missing experiment details', async () => {
  const experiments = await ExperimentStorageService.instance.getExperiments(true);
  experiments.forEach(experiment => {
    expect(experiment.configuration.brainProcesses).toBe(1);
  });
});