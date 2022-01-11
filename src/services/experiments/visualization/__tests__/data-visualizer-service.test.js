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

<<<<<<< HEAD
test('loadTopics gets ROS topics', async () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'getTopics').mockImplementation();
  expect(await DataVisualizerService.instance.loadTopics('mock-server-url')).toBeUndefined();
});

test('sendSettings set and send the settings to the data visualizer', () => {
=======
test('getSimulationState returns the state of the experiment', async () => {
  jest.spyOn(SimulationService.instance, 'getState').mockImplementation(() => {
    return Promise.resolve(EXPERIMENT_STATE.INITIALIZED);
  })
  expect(await DataVisualizerService.instance.getSimulationState('mock-server-url', 'mock-simulation-ID'))
    .toBe(EXPERIMENT_STATE.INITIALIZED)
});

test('loadSortedSources gets ROS topics', async () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'getTopics').mockImplementation();
  expect(await DataVisualizerService.instance.loadSortedSources('mock-server-url')).toBeUndefined();
});

test('sendSettings sets and sends the settings to the data visualizer', () => {
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  let onSendSettings = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.SETTINGS, onSendSettings
  );
<<<<<<< HEAD
  DataVisualizerService.instance.sendSettings({ setting: 'mock-setting' });
=======

  DataVisualizerService.instance.sendSettings({ setting: 'mock-setting' });

>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  expect(DataVisualizerService.instance.settings).toStrictEqual({ setting: 'mock-setting' });
  expect(onSendSettings).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.SETTINGS, onSendSettings
  );
});

<<<<<<< HEAD
test('sendSortedSources send the sorted sources to the data visualizer', () => {
=======
test('sendSortedSources sends the sorted sources to the data visualizer', () => {
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  let onSendSortedSources = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.SORTED_SOURCES, onSendSortedSources
  );
<<<<<<< HEAD
  DataVisualizerService.instance.sendSortedSources('mock-sources');
=======

  DataVisualizerService.instance.sendSortedSources('mock-sources');

>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  expect(onSendSortedSources).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.SORTED_SOURCES, onSendSortedSources
  );
});

<<<<<<< HEAD
test('sendMessageAndTopics send messages and topics to the data visualizer', () => {
  let onSendMessageAndTopics = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.MESSAGE_AND_TOPICS, onSendMessageAndTopics
  );
  DataVisualizerService.instance.sendMessageAndTopics('mock-message', 'mock-topics');
  expect(onSendMessageAndTopics).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.EVENTS.MESSAGE_AND_TOPICS, onSendMessageAndTopics
=======
test('sendStandardMessage sends standard message to the data visualizer', () => {
  let onSendStandardMessage = jest.fn();
  DataVisualizerService.instance.addListener(
    DataVisualizerService.EVENTS.STANDARD_MESSAGE, onSendStandardMessage
  );

  DataVisualizerService.instance.sendStandardMessage('mock-message', 'mock-topics');

  expect(onSendStandardMessage).toHaveBeenCalled();
  DataVisualizerService.instance.removeListener(
    DataVisualizerService.STANDARD_MESSAGE, onSendStandardMessage
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  );
});

test('saveSettings set key, set settings and save settings', () => {
  jest.spyOn(UserSettingsService.instance, 'saveSettings').mockImplementation();
  jest.spyOn(DataVisualizerService.instance, 'setKey').mockImplementation();
  DataVisualizerService.instance.settings = { setting: 'mock-setting' };
<<<<<<< HEAD
  DataVisualizerService.instance.saveSettings('mock-key', 'mock-is-structure', 'mock-is-plot',
    'mock-axis-labels', 'mock-plot-model', 'mock-plot-structure');
=======

  DataVisualizerService.instance.saveSettings('mock-key', 'mock-is-structure', 'mock-is-plot',
    'mock-axis-labels', 'mock-plot-model', 'mock-plot-structure');

>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
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

<<<<<<< HEAD
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
=======
test('initializeConnection gets the server configuration, gets  a ROS connection and subscribe to ROS topics', () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'getConnection').mockImplementation(() => {
    return 'mock-connection';
  });
  jest.spyOn(DataVisualizerROSAdapter.instance, 'subscribeTopics').mockImplementation();

  DataVisualizerService.instance.initializeConnection('mock-plot-structure', 'mock-simulation-id');

  expect(DataVisualizerROSAdapter.instance.getConnection).toHaveBeenCalled();
  expect(DataVisualizerROSAdapter.instance.subscribeTopics).toHaveBeenCalled();
});

test('closeConnection unsubscribes ROS topics', () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'unsubscribeTopics').mockImplementation();
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
  DataVisualizerService.instance.closeConnection();
  expect(DataVisualizerROSAdapter.instance.unsubscribeTopics).toHaveBeenCalled();
})