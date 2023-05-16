/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import PublicExperimentsService from '../public-experiments-service';
import DialogService from '../../../dialog-service.js';
import endpoints from '../../../proxy/data/endpoints.json';
import MockExperiments from '../../../../mocks/mock_experiments.json';
import {NRPProxyError} from '../../../proxy/http-proxy-service'

const config = window.appConfig;

const proxyEndpoint = endpoints.proxy;
const experimentsUrl = `${proxyEndpoint.experiments.url}`;

jest.setTimeout(3 * PublicExperimentsService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);

let onWindowBeforeUnloadCb = undefined;
beforeEach(() => {
  jest.spyOn(window, 'addEventListener').mockImplementation((event, cb) => {
    if (event === 'beforeunload') {
      onWindowBeforeUnloadCb = cb;
    }
  });
  URL.createObjectURL = jest.fn().mockReturnValue('http://mock.thumbnail.url');
});

describe('PublicExperimentsService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new PublicExperimentsService();
    }).toThrow(Error);
    expect(() => {
      new PublicExperimentsService();
    }).toThrowError(Error('Use PublicExperimentsService.instance'));
  });

  test('the experiments service instance always refers to the same object', () => {
    const instance1 = PublicExperimentsService.instance;
    const instance2 = PublicExperimentsService.instance;
    expect(instance1).toBe(instance2);
  });

  test('fetches the list of experiments', async () => {
    jest.spyOn(PublicExperimentsService.instance, 'performRequest');

    const experiments = await PublicExperimentsService.instance.getExperiments();
    expect(PublicExperimentsService.instance.performRequest)
      .toHaveBeenCalledWith(experimentsUrl, PublicExperimentsService.instance.GETOptions);
    expect(experiments[0].name).toBe('husky_braitenberg_unfilled_name');
    expect(experiments[1].configuration.maturity).toBe('production');

    // no forced update should not result in additional requests being sent
    let oldCallCount = PublicExperimentsService.instance.performRequest.mock.calls.length;
    await PublicExperimentsService.instance.getExperiments();
    expect(PublicExperimentsService.instance.performRequest.mock.calls.length).toBe(oldCallCount);

    // forced update should result in new request
    await PublicExperimentsService.instance.getExperiments(true);
    expect(PublicExperimentsService.instance.performRequest.mock.calls.length > oldCallCount).toBe(true);
  });

  test('raises the unexpectedError dialog on Error', async () => {
    // error should appear if the service is unavailable (use force update)
    // and return value should be null
    jest.spyOn(DialogService.instance, 'unexpectedError');
    jest.spyOn(PublicExperimentsService.instance, 'httpRequestGET').mockImplementationOnce(async () => {
      throw new Error('Test Error');
    });
    const nullExperiments = await PublicExperimentsService.instance.getExperiments(true);
    expect(nullExperiments).toBeNull();
    expect(DialogService.instance.unexpectedError).toBeCalled();
  });

  test('raises the networkError dialog on NRPProxyError', async () => {
    // error should appear if the service is unavailable (use force update)
    // and return value should be null
    jest.spyOn(DialogService.instance, 'networkError');
    jest.spyOn(PublicExperimentsService.instance, 'httpRequestGET').mockImplementationOnce(async () => {
      throw new NRPProxyError('Test NRPProxyError', null, null);
    });
    const nullExperiments = await PublicExperimentsService.instance.getExperiments(true);
    expect(nullExperiments).toBeNull();
    expect(DialogService.instance.networkError).toBeCalled();
  });

  test('emits an event when updating the experiment list', async () => {
    let onUpdateExperiments = jest.fn();
    PublicExperimentsService.instance.addListener(
      PublicExperimentsService.EVENTS.UPDATE_EXPERIMENTS, onUpdateExperiments);
    await PublicExperimentsService.instance.getExperiments(true);
    expect(onUpdateExperiments).toHaveBeenCalled();
    PublicExperimentsService.instance.removeListener(
      PublicExperimentsService.EVENTS.UPDATE_EXPERIMENTS, onUpdateExperiments);
  });

  test('does automatic poll updates of experiment list which can be stopped', (done) => {
    jest.spyOn(PublicExperimentsService.instance, 'getExperiments');

    // check that getExperiments is periodically called after poll interval
    let numCallsT0 = PublicExperimentsService.instance.getExperiments.mock.calls.length;
    setTimeout(() => {
      let numCallsT1 = PublicExperimentsService.instance.getExperiments.mock.calls.length;
      expect(numCallsT1 > numCallsT0).toBe(true);

      // stop updates and check that no more calls occur after poll interval
      PublicExperimentsService.instance.stopUpdates();
      setTimeout(() => {
        let numCallsT2 = PublicExperimentsService.instance.getExperiments.mock.calls.length;
        expect(numCallsT2 === numCallsT1).toBe(true);
        done();
      }, PublicExperimentsService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);
    }, PublicExperimentsService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);
  });

  test('should stop polling updates when window is unloaded', async () => {
    let service = PublicExperimentsService.instance;
    expect(onWindowBeforeUnloadCb).toBeDefined();

    jest.spyOn(service, 'stopUpdates');
    onWindowBeforeUnloadCb({});
    expect(service.stopUpdates).toHaveBeenCalled();
  });

  // TODO: [NRRPLT-8681] Fix endpoint
  test.skip('gets a thumbnail image for experiments', async () => {
    let experiment = MockExperiments[0];
    const imageBlob = await PublicExperimentsService.instance.getThumbnail(experiment.name);
    expect(imageBlob).toBeDefined();
  });

  test('sorts the local experiment list by display name case-insensitive', async () => {
    let mockExperimentList = [
      {
        configuration: { SimulationName: 'Bcd' }
      },
      {
        configuration: { SimulationName: 'cde' }
      },
      {
        configuration: { SimulationName: 'bcd' }
      },
      {
        configuration: { SimulationName: 'Abc' }
      }
    ];
    PublicExperimentsService.instance.experiments = mockExperimentList;
    PublicExperimentsService.instance.sortExperiments(mockExperimentList);
    expect(mockExperimentList[0].configuration.SimulationName).toBe('Abc');
    expect(mockExperimentList[1].configuration.SimulationName).toBe('Bcd');
    expect(mockExperimentList[2].configuration.SimulationName).toBe('bcd');
    expect(mockExperimentList[3].configuration.SimulationName).toBe('cde');
  });

  // TODO: [NRRPLT-8722] unify public and storage experiments object (configuration)
  test.skip('clones the experiment', async () => {
    jest.spyOn(PublicExperimentsService.instance, 'httpRequestPOST');
    await PublicExperimentsService.instance.cloneExperiment(MockExperiments[0]);

    expect(PublicExperimentsService.instance.httpRequestPOST).toBeCalledWith(
      `${config.api.proxy.url}${endpoints.proxy.storage.clone.url}/${MockExperiments[0].name}`
    );
  });
});
