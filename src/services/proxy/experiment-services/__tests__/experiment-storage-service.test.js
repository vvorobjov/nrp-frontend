/**
 * @jest-environment node
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ExperimentStorageService from '../experiment-storage-service';
import endpoints from '../../data/endpoints.json';
import config from '../../../../config.json';
jest.mock('../../../authentication-service');

const proxyEndpoint = endpoints.proxy;
const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.storage.experiments.url}`;

test('fetches the list of experiments', async () => {
  jest.spyOn(ExperimentStorageService.instance, 'performRequest');
  const experiments = await ExperimentStorageService.instance.getExperiments();
  expect(ExperimentStorageService.instance.performRequest).toHaveBeenCalledWith(experimentsUrl, ExperimentStorageService.instance.options);
  expect(experiments[0].name).toBe('braitenberg_husky_holodeck_1_0_0');
  expect(experiments[1].configuration.maturity).toBe('production');
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