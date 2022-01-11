/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import UserSettingsService from '../../../user/user-settings-service';
<<<<<<< HEAD

import DataVisualizerROSAdapter from '../data-visualizer-rosadapter';
=======
import DataVisualizerService from '../data-visualizer-service';
import SimulationService from '../../execution/running-simulation-service';
import RoslibService from '../../../roslib-service';

import DataVisualizerROSAdapter from '../data-visualizer-rosadapter';
import mockResponse from '../__mocks__/response.json';
import mockPlotStructure from '../__mocks__/plot-structure.json';
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c

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

<<<<<<< HEAD
test('getTopics set settings and send ROS topics', async () => {
  UserSettingsService.instance.settingsData = { setting: 'mock-setting' };
  jest.spyOn(DataVisualizerROSAdapter.instance, 'sendTopics').mockImplementation();
  await DataVisualizerROSAdapter.instance.getTopics('mock-server');
  expect(DataVisualizerROSAdapter.instance.settings).toStrictEqual({ setting: 'mock-setting' });
  expect(DataVisualizerROSAdapter.instance.sendTopics).toHaveBeenCalled;
})

test('sendTopics create, sort, load and send an array of topics, and send settings', () => {
  return;
});
=======
test('getTopics sets settings and sends ROS topics', async () => {
  UserSettingsService.instance.settingsData = { setting: 'mock-setting' };
  jest.spyOn(DataVisualizerROSAdapter.instance, 'sendTopics').mockImplementation();

  await DataVisualizerROSAdapter.instance.getTopics('mock-server-url, mock-simulation-id');

  expect(DataVisualizerROSAdapter.instance.settings).toStrictEqual({ setting: 'mock-setting' });
  expect(DataVisualizerROSAdapter.instance.sendTopics).toHaveBeenCalled();
})

test('sendTopics create, sort, load and send an array of topics, and send settings', async () => {
  jest.spyOn(DataVisualizerROSAdapter.instance, 'loadRobotTopics').mockImplementation();
  jest.spyOn(DataVisualizerService.instance, 'sendSortedSources').mockImplementation();
  jest.spyOn(DataVisualizerService.instance, 'sendSettings').mockImplementation();

  await DataVisualizerROSAdapter.instance.sendTopics(mockResponse, 'mock-server-url', 'mock-simulation-id');

  expect(DataVisualizerROSAdapter.instance.topics).toStrictEqual({ Time: '_time', '/client_count': 'std_msgs/Int32' });
  expect(DataVisualizerROSAdapter.instance.sortedTopics).toStrictEqual([ '/client_count', 'Time' ]);
  expect(DataVisualizerROSAdapter.instance.loadRobotTopics).toHaveBeenCalled();
  expect(DataVisualizerService.instance.sendSortedSources).toHaveBeenCalled();
  expect(DataVisualizerROSAdapter.instance.loadSettingsWhenTopic).toBe(false);
  expect(DataVisualizerService.instance.sendSettings).toHaveBeenCalled();
});

test('loadRobotTopics loads robot topics, and start a ROS service', async () => {
  jest.spyOn(SimulationService.instance, 'getRobots').mockImplementation(() => {
    return { robots: [{ robotId: 0 }]};
  });

  await DataVisualizerROSAdapter.instance.loadRobotTopics('mock-server-url', 'mock-simulation-id');

  expect(SimulationService.instance.getRobots).toHaveBeenCalled();
  expect(DataVisualizerROSAdapter.instance.topics).toStrictEqual({
    Time: '_time',
    '/client_count': 'std_msgs/Int32',
    '/0/model_state/position.x': 'gazebo_msgs/ModelStates',
    '/0/model_state/position.y': 'gazebo_msgs/ModelStates',
    '/0/model_state/position.z': 'gazebo_msgs/ModelStates',
    '/0/model_state/angle.x': 'gazebo_msgs/ModelStates',
    '/0/model_state/angle.y': 'gazebo_msgs/ModelStates',
    '/0/model_state/angle.z': 'gazebo_msgs/ModelStates'
  });
});

test('getConnection gets ROS connection', () => {
  jest.spyOn(RoslibService.instance, 'getConnection').mockImplementation();
  DataVisualizerROSAdapter.instance.getConnection({ rosbridge:{ weboscket: 'mock-websocket' } });
  expect(RoslibService.instance.getConnection).toHaveBeenCalled();
});

test('sendStandardMessage sends standard message and topics', () => {
  jest.spyOn(DataVisualizerService.instance, 'sendStandardMessage').mockImplementation();
  DataVisualizerROSAdapter.instance.sendStandardMessage('mock-message');
  expect(DataVisualizerService.instance.sendStandardMessage).toHaveBeenCalled();
});

test('sendStateMessage sends state message and topics', () => {
  jest.spyOn(DataVisualizerService.instance, 'sendStateMessage').mockImplementation();
  DataVisualizerROSAdapter.instance.sendStateMessage('mock-message');
  expect(DataVisualizerService.instance.sendStateMessage).toHaveBeenCalled();
});

test('subscribeTopics creates and subscribes to topics', () => {
   let mockSubscribe = { subscribe: () => { return; }, unsubscribe: () => { return; } }
  jest.spyOn(RoslibService.instance, 'createTopic').mockImplementation(() => {
    return mockSubscribe;
  });
  DataVisualizerROSAdapter.instance.subscribeTopics(mockPlotStructure);
  expect(DataVisualizerROSAdapter.instance.topicConnections).toStrictEqual([mockSubscribe, mockSubscribe, mockSubscribe]);
});

test('unsubscribeTopics unsubscribes topics, and reinitialize topicConnections and rosConnection', () => {
  DataVisualizerROSAdapter.instance.unsubscribeTopics();
  expect(DataVisualizerROSAdapter.instance.topicConnections).toStrictEqual([]);
  expect(DataVisualizerROSAdapter.instance.rosConnection).toBeUndefined();
});
>>>>>>> 4d2addeed3e8d0de50738a0834e279fa4e92363c
