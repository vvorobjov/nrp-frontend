/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import ModelsStorageService from '../models-storage-service';
import DialogService from '../../dialog-service';

jest.mock('../../authentication-service.js');


afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
});

describe('ModelsStorageService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new ModelsStorageService();
    }).toThrow(Error);
    expect(() => {
      new ModelsStorageService();
    }).toThrowError(Error('Use ModelsStorageService.instance'));
  });

  test('the service instance always refers to the same object', () => {
    const instance1 = ModelsStorageService.instance;
    const instance2 = ModelsStorageService.instance;
    expect(instance1).toBe(instance2);
  });


  test('getTemplateModels function', async () => {

    let modelsService = ModelsStorageService.instance;

    // fetch template robots
    let response = await modelsService.getTemplateModels(true, 'robots', false);
    expect(response.name).toBe('hbp_clearpath_robotics_husky_a200');
    expect(response.ownerName).toBe('nrpuser');
    expect(response.type).toBe('robots');

    // fetch custom robots
    response = await modelsService.getTemplateModels(true, 'robots', true);
    expect(response.name).toBe('custom_hbp_clearpath_robotics_husky_a200');
    expect(response.ownerName).toBe('nrpuser');
    expect(response.type).toBe('robots');
  });

  test('getCustomModelsByUser function', async () => {

    let modelsService = ModelsStorageService.instance;

    // fetch template robots
    let response = await modelsService.getCustomModelsByUser('robots');
    expect(response.name).toBe('custom_hbp_clearpath_robotics_husky_a200');
    expect(response.ownerName).toBe('nrpuser');
    expect(response.type).toBe('robots');

    // Check that the error dialog is thrown on network error
    jest.spyOn(DialogService.instance, 'networkError');
    jest.spyOn(ModelsStorageService.instance, 'httpRequestGET').mockImplementation(async () => {
      throw new Error('Test error');
    });
    await modelsService.getCustomModelsByUser('robots');
    expect(DialogService.instance.networkError).toBeCalled();
  });

  test('verifyModelType function', async () => {

    let modelsService = ModelsStorageService.instance;
    const expectedErrorPart = 'Error Type 400: Bad Request : The model type notRobots';
    // fetch template robots
    expect(() => modelsService.verifyModelType('notRobots')).toThrowError(expectedErrorPart);

  });

  test('setCustomModel function', async () => {
    let modelsService = ModelsStorageService.instance;

    let response = await modelsService.setCustomModel('robots', 'husky', 'fakeContent');
    expect(response.name).toBe('created_hbp_clearpath_robotics_husky_a200');
    expect(response.ownerName).toBe('nrpuser');
    expect(response.type).toBe('robots');

    // Check that the error dialog is thrown on network error
    jest.spyOn(DialogService.instance, 'networkError');
    jest.spyOn(ModelsStorageService.instance, 'httpRequestPOST').mockImplementation(async () => {
      throw new Error('Test error');
    });
    await modelsService.setCustomModel('robots', 'husky', 'fakeContent');
    expect(DialogService.instance.networkError).toBeCalled();
  });
});
