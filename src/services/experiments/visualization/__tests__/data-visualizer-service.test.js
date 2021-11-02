/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import DataVisualizerService from '../data-visualizer-service';
import SimulationService from '../../execution/running-simulation-service';
import DataVisualizerROSAdapter from '../data-visualizer-rosadapter';
import UserSettingsService from '../../../user/user-settings-service';
import ServerResourcesService from '../../execution/server-resources-service';

import { EXPERIMENT_STATE } from '../../experiment-constants';

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new DataVisualizerService();
  }).toThrow(Error);
  expect(() => {
    new DataVisualizerService();
  }).toThrowError(Error('Use DataVisualizerService.instance'));
});

test('the data visualizer service instance always refers to the same object', () => {
  const instance1 = DataVisualizerService.instance;
  const instance2 = DataVisualizerService.instance;
  expect(instance1).toBe(instance2);
});

test('setKey sets the key of the data visualizer service', () => {
  DataVisualizerService.instance.setKey('mock-key');
  expect(DataVisualizerService.instance.key).toBe('mock-key');
});

test('getSimulationState returns the state of the experiment', async () => {
  jest.spyOn(SimulationService.instance, 'getState').mockImplementation(() => {
    return Promise.resolve(EXPERIMENT_STATE.INITIALIZED);
  })
  expect(await DataVisualizerService.instance.getSimulationState('mock-server-url', 'mock-simulation-ID'))
    .toBe(EXPERIMENT_STATE.INITIALIZED)
});

test('loadTopics gets ROS topics', async () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'getTopics').mockImplementation();
  expect(await DataVisualizerService.instance.loadTopics('mock-server-url')).toBeUndefined();
});

test('sendSettings set and send the settings to the data visualizer', () => {
  let onSendSettings = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.SETTINGS, onSendSettings
  );
  DataVisualizerService.instance.sendSettings({ setting: 'mock-setting' });
  expect(DataVisualizerService.instance.settings).toStrictEqual({ setting: 'mock-setting' });
  expect(onSendSettings).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.SETTINGS, onSendSettings
  );
});

test('sendSortedSources send the sorted sources to the data visualizer', () => {
  let onSendSortedSources = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.SORTED_SOURCES, onSendSortedSources
  );
  DataVisualizerService.instance.sendSortedSources('mock-sources');
  expect(onSendSortedSources).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.SORTED_SOURCES, onSendSortedSources
  );
});

test('sendMessageAndTopics send messages and topics to the data visualizer', () => {
  let onSendMessageAndTopics = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.MESSAGE_AND_TOPICS, onSendMessageAndTopics
  );
  DataVisualizerService.instance.sendMessageAndTopics('mock-message', 'mock-topics');
  expect(onSendMessageAndTopics).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.MESSAGE_AND_TOPICS, onSendMessageAndTopics
  );
});

test('saveSettings set key, set settings and save settings', () => {
  jest.spyOn(UserSettingsService.instance, 'saveSettings').mockImplementation();
  jest.spyOn(DataVisualizerService.instance, 'setKey').mockImplementation();
  DataVisualizerService.instance.settings = { setting: 'mock-setting' };
  DataVisualizerService.instance.saveSettings('mock-key', 'mock-is-structure', 'mock-is-plot',
    'mock-axis-labels', 'mock-plot-model', 'mock-plot-structure');
  expect(DataVisualizerService.instance.setKey).toHaveBeenCalled();
  expect(DataVisualizerService.instance.settings.isStructure).toBe('mock-is-structure');
  expect(DataVisualizerService.instance.settings.isPlot).toBe('mock-is-plot');
  expect(DataVisualizerService.instance.settings.axisLabels).toBe('mock-axis-labels');
  expect(DataVisualizerService.instance.settings.plotModel).toBe('mock-plot-model');
  expect(DataVisualizerService.instance.settings.plotStructure).toBe('mock-plot-structure');
  expect(UserSettingsService.instance.saveSettings).toHaveBeenCalled();
});

test('unregisterPlot saves settings', () => {
  jest.spyOn(UserSettingsService.instance, 'saveSettings').mockImplementation();
  DataVisualizerService.instance.unregisterPlot('mock-key-2');
  expect(UserSettingsService.instance.saveSettings).toHaveBeenCalled();
});

test('initializeConnection gets the server configuration, get/create a ROS connection and subscribe to ROS topics', () => {
  jest.spyOn(ServerResourcesService.instance, 'getServerConfig').mockImplementation(() => {
    return 'mock-server';
  });
  jest.spyOn(DataVisualizerROSAdapter.instance, 'getOrCreateConnectionTo').mockImplementation(() => {
    return 'mock-connection';
  });
  jest.spyOn(DataVisualizerROSAdapter.instance, 'subscribeTopics').mockImplementation();
  DataVisualizerService.instance.adapter = { name: 'ROS' };
  DataVisualizerService.instance.initializeConnection('mock-plot-structure', 'mock-simulation-id');
  expect(ServerResourcesService.instance.getServerConfig).toHaveBeenCalled();
  expect(DataVisualizerService.instance.connection).toBe('mock-connection');
  expect(DataVisualizerROSAdapter.instance.subscribeTopics).toHaveBeenCalled();
});

test('closeConnection unsubscribe ROS topics', () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'unsubscribeTopics').mockImplementation();
  DataVisualizerService.instance.adapter = { name: 'ROS' };
  DataVisualizerService.instance.closeConnection();
  expect(DataVisualizerROSAdapter.instance.unsubscribeTopics).toHaveBeenCalled();
})