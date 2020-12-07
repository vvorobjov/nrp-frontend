/**
 * @jest-environment node
*/
import '@testing-library/jest-dom'
import 'jest-fetch-mock'

import ExperimentsService from '../experiments-service'
import endpoints from '../data/endpoints.json'
import config from '../../../config.json';
import AuthenticationService from '../../authentication-service';
jest.mock('../../authentication-service');

const proxyEndpoint = endpoints.proxy;
const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.experiments.url}`

test('fetches the list of experiments', async () => {
  jest.spyOn(ExperimentsService.instance, 'performRequest');
  const experiments = await ExperimentsService.instance.getExperiments();
  expect(ExperimentsService.instance.performRequest).toHaveBeenCalledWith(experimentsUrl, ExperimentsService.instance.options);
  expect(experiments[0].name).toBe('braitenberg_husky_holodeck_1_0_0');
  expect(experiments[1].configuration.maturity).toBe('production');

})

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new ExperimentsService();
  }).toThrow(Error);
  expect(() => {
    new ExperimentsService();
  }).toThrowError(Error('Use ExperimentsService.instance'));

})

test('the experiments service instance always refers to the same object', () => {
  const instance1 = ExperimentsService.instance;
  const instance2 = ExperimentsService.instance;
  expect(instance1).toBe(instance2);
})