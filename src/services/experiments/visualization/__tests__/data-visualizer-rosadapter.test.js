/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import UserSettingsService from '../../../user/user-settings-service';
import SimulationService from '../../execution/running-simulation-service';

jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  Map: () => ({})
}));

import DataVisualizerROSAdapter from '../data-visualizer-rosadapter';

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new DataVisualizerROSAdapter();
  }).toThrow(Error);
  expect(() => {
    new DataVisualizerROSAdapter();
  }).toThrowError(Error('Use DataVisualizerROSAdapter.instance'))
});

test('the data visualizer ROS adapter instance always refers to the same object', () => {
  const instance1 = DataVisualizerROSAdapter.instance;
  const instance2 = DataVisualizerROSAdapter.instance;
  expect(instance1).toBe(instance2);
});

test('getTopics set settings and send ROS topics', async () => {
  UserSettingsService.instance.settingsData = { setting: 'mock-setting' };
  jest.spyOn(DataVisualizerROSAdapter.instance, 'sendTopics').mockImplementation();
  await DataVisualizerROSAdapter.instance.getTopics('mock-server');
  expect(DataVisualizerROSAdapter.instance.settings).toStrictEqual({ setting: 'mock-setting' });
  expect(DataVisualizerROSAdapter.instance.sendTopics).toHaveBeenCalled;
})

test('sendTopics create, sort, load and send an array of topics, and send settings', () => {
  
});
