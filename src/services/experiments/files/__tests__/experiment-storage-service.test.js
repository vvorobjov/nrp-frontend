/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ExperimentStorageService from '../experiment-storage-service';
import DialogService from '../../../dialog-service.js';
import endpoints from '../../../proxy/data/endpoints.json';
import MockExperiments from '../../../../mocks/mock_experiments.json';
import {NRPProxyError} from '../../../proxy/http-proxy-service'


const proxyEndpoint = endpoints.proxy;
const experimentsUrl = `${proxyEndpoint.storage.experiments.url}`;

jest.setTimeout(3 * ExperimentStorageService.CONSTANTS.INTERVAL_POLL_EXPERIMENTS);

let onWindowBeforeUnloadCb = undefined;
beforeEach(() => {
  jest.spyOn(window, 'addEventListener').mockImplementation((event, cb) => {
    if (event === 'beforeunload') {
      onWindowBeforeUnloadCb = cb;
    }
  });
  URL.createObjectURL = jest.fn().mockReturnValue('http://mock.thumbnail.url');
});

describe('ExperimentStorageService', () => {

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
      .toHaveBeenCalledWith(experimentsUrl, ExperimentStorageService.instance.GETOptions);
    expect(experiments[0].name).toBe('husky_braitenberg_unfilled_name');
    expect(experiments[1].configuration.maturity).toBe('production');

    // no forced update should not result in additional requests being sent
    let oldCallCount = ExperimentStorageService.instance.performRequest.mock.calls.length;
    await ExperimentStorageService.instance.getExperiments();
    expect(ExperimentStorageService.instance.performRequest.mock.calls.length).toBe(oldCallCount);

    // forced update should result in new request
    await ExperimentStorageService.instance.getExperiments(true);
    expect(ExperimentStorageService.instance.performRequest.mock.calls.length > oldCallCount).toBe(true);
  });

  test('raises the unexpectedError dialog on Error', async () => {
    // error should appear if the service is unavailable (use force update)
    // and return value should be null
    jest.spyOn(DialogService.instance, 'unexpectedError');
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestGET').mockImplementationOnce(async () => {
      throw new Error('Test Error');
    });
    const nullExperiments = await ExperimentStorageService.instance.getExperiments(true);
    expect(nullExperiments).toBeNull();
    expect(DialogService.instance.unexpectedError).toBeCalled();
  });

  test('raises the networkError dialog on NRPProxyError', async () => {
    // error should appear if the service is unavailable (use force update)
    // and return value should be null
    jest.spyOn(DialogService.instance, 'networkError');
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestGET').mockImplementationOnce(async () => {
      throw new NRPProxyError('Test NRPProxyError', null, null);
    });
    const nullExperiments = await ExperimentStorageService.instance.getExperiments(true);
    expect(nullExperiments).toBeNull();
    expect(DialogService.instance.networkError).toBeCalled();
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

  test('should stop polling updates when window is unloaded', async () => {
    let service = ExperimentStorageService.instance;
    expect(onWindowBeforeUnloadCb).toBeDefined();

    jest.spyOn(service, 'stopUpdates');
    onWindowBeforeUnloadCb({});
    expect(service.stopUpdates).toHaveBeenCalled();
  });

  // TODO: [NRRPLT-8681]
  test.skip('gets a thumbnail image for experiments', async () => {
    let experiment = MockExperiments[0];
    const imageBlob = await ExperimentStorageService.instance.getThumbnail(experiment.name,
      experiment.configuration.thumbnail);
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
    ExperimentStorageService.instance.experiments = mockExperimentList;
    ExperimentStorageService.instance.sortExperiments(mockExperimentList);
    expect(mockExperimentList[0].configuration.SimulationName).toBe('Abc');
    expect(mockExperimentList[1].configuration.SimulationName).toBe('Bcd');
    expect(mockExperimentList[2].configuration.SimulationName).toBe('bcd');
    expect(mockExperimentList[3].configuration.SimulationName).toBe('cde');
  });

  test('fills missing experiment details', async () => {
    const experiments = await ExperimentStorageService.instance.getExperiments(true);
    console.info(experiments);

    // missing details are filled, see src/mocks/mock_experiments.json
    let experiment = experiments[0];
    expect(experiment.configuration.DataPackProcessor).toEqual(ExperimentStorageService.instance.default_DataPackProcessor);
    expect(experiment.configuration.SimulationLoop).toEqual(ExperimentStorageService.instance.default_SimulationLoop);
    expect(experiment.configuration.SimulationTimestep).toEqual(ExperimentStorageService.instance.default_SimulationTimestep);
    expect(experiment.configuration.ProcessLauncherType).toEqual(ExperimentStorageService.instance.default_ProcessLauncherType);
    expect(experiment.configuration.SimulationTimeout).toEqual(ExperimentStorageService.instance.default_SimulationTimeout);

    // existing details are not touched, see src/mocks/mock_experiments.json
    experiment = experiments[1];
    expect(experiment.configuration.DataPackProcessor).toEqual(MockExperiments[1].configuration.DataPackProcessor);
    expect(experiment.configuration.SimulationLoop).toEqual(MockExperiments[1].configuration.SimulationLoop);
    expect(experiment.configuration.SimulationTimestep).toEqual(MockExperiments[1].configuration.SimulationTimestep);
    expect(experiment.configuration.ProcessLauncherType).toEqual(MockExperiments[1].configuration.ProcessLauncherType);
    expect(experiment.configuration.SimulationTimeout).toEqual(MockExperiments[1].configuration.SimulationTimeout);
  });

  test('clones the experiment', async () => {
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestPOST');
    await ExperimentStorageService.instance.cloneExperiment(MockExperiments[0]);

    expect(ExperimentStorageService.instance.httpRequestPOST).toBeCalledWith(
      `${endpoints.proxy.storage.clone.url}/${MockExperiments[0].name}`
    );
  });

  test('gets the list of the experiment files', async () => {
    // TODO: properly mock the list of files, src/mocks/handlers.js
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestGET');

    let fileList = await ExperimentStorageService.instance.getExperimentFiles(MockExperiments[0].name);
    expect(ExperimentStorageService.instance.httpRequestGET).toBeCalledWith(
      `${endpoints.proxy.storage.url}/${MockExperiments[0].name}`
    );
    expect(fileList).toEqual({ 'description': 'fileList' });
  });

  test('removes files', async () => {
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestDELETE');

    await ExperimentStorageService.instance.deleteExperiment(MockExperiments[0].name);
    expect(ExperimentStorageService.instance.httpRequestDELETE).toHaveBeenNthCalledWith(
      1,
      `${endpoints.proxy.storage.url}/${MockExperiments[0].name}`
    );

    let entityName = 'someEntity';
    let expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=false&type=folder`;
    await ExperimentStorageService.instance.deleteFolder(MockExperiments[0].name, entityName);
    expect(ExperimentStorageService.instance.httpRequestDELETE).toHaveBeenNthCalledWith(
      2,
      expectedArg
    );

    expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=true&type=folder`;
    await ExperimentStorageService.instance.deleteFolder(MockExperiments[0].name, entityName, true);
    expect(ExperimentStorageService.instance.httpRequestDELETE).toHaveBeenNthCalledWith(
      3,
      expectedArg
    );

    expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=false&type=file`;
    await ExperimentStorageService.instance.deleteFile(MockExperiments[0].name, entityName);
    expect(ExperimentStorageService.instance.httpRequestDELETE).toHaveBeenNthCalledWith(
      4,
      expectedArg
    );

    expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=true&type=file`;
    await ExperimentStorageService.instance.deleteFile(MockExperiments[0].name, entityName, true);
    expect(ExperimentStorageService.instance.httpRequestDELETE).toHaveBeenNthCalledWith(
      5,
      expectedArg
    );
  });
  
  test('creates files', async () => {
    jest.spyOn(ExperimentStorageService.instance, 'httpRequestPOST');
    let data = [];
    let entityName = 'someEntity.txt';

    const res1 = await (await ExperimentStorageService.instance.setFile(MockExperiments[0].name, entityName, data)).json();
    const res2 = await (await ExperimentStorageService.instance.setFile(MockExperiments[0].name, entityName, data, false, 'application/json')).json();
    const res3 = await (await ExperimentStorageService.instance.setFile(MockExperiments[0].name, entityName, data, true, 'application/octet-stream')).json();
    const res4 = await ExperimentStorageService.instance.setFile(MockExperiments[0].name, entityName, data, true, 'throw-error');

    // In total, only 3 requests should be sent (4th gives error)
    expect(ExperimentStorageService.instance.httpRequestPOST).toHaveBeenCalledTimes(3);

    // checking 1st call
    let expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=true`;
    expect(ExperimentStorageService.instance.httpRequestPOST).toHaveBeenNthCalledWith(
      1,
      expectedArg,
      data,
      expect.anything()
    );
    expect(res1.type).toEqual('text/plain');

    // checking 2nd call
    expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=false`;
    expect(ExperimentStorageService.instance.httpRequestPOST).toHaveBeenNthCalledWith(
      2,
      expectedArg,
      JSON.stringify(data),
      expect.anything()
    );
    expect(res2.type).toEqual('application/json');

    // checking 3rd call
    expectedArg = `${endpoints.proxy.storage.url}/${MockExperiments[0].name}/${entityName}?byname=true`;
    expect(ExperimentStorageService.instance.httpRequestPOST).toHaveBeenNthCalledWith(
      3,
      expectedArg,
      data,
      expect.anything()
    );
    expect(res3.type).toEqual('application/octet-stream');

    // unknown data type should give an error
    expect(res4).toBeInstanceOf(Error);
  });
});
