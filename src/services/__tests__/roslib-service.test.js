/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import * as ROSLIB from 'roslib';
import RoslibService from '../roslib-service';

describe.skip('RoslibService', () => {
  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new RoslibService();
    }).toThrow(Error);
    expect(() => {
      new RoslibService();
    }).toThrowError(Error('Use RoslibService.instance'));
  });

  test('the experiments service instance always refers to the same object', () => {
    const instance1 = RoslibService.instance;
    const instance2 = RoslibService.instance;
    expect(instance1).toBe(instance2);
  });

  test('can provide ROS connections', () => {
    jest.spyOn(ROSLIB, 'Ros').mockReturnValue({});
    let connection1 = RoslibService.instance.getConnection('test-ros-ws-url');
    let connection2 = RoslibService.instance.getConnection('test-ros-ws-url');
    expect(connection1).toBe(connection2);
    expect(ROSLIB.Ros).toHaveBeenCalledTimes(1);
  });

  test('can create ROS topics with additional options', () => {
    let mockTopic = {};
    jest.spyOn(ROSLIB, 'Topic').mockReturnValue(mockTopic);
    let rosConnection = {};
    let topicName = 'test-topic-name';
    let messageType = 'test-message-type';
    let additionalOptions = {
      something: {},
      else: true
    };

    let topic = RoslibService.instance.createTopic(rosConnection, topicName, messageType, additionalOptions);
    expect(topic).toBe(mockTopic);
    let expectedTopicOptions = {
      ros: rosConnection,
      name: topicName,
      messageType: messageType,
      something: additionalOptions.something,
      else: additionalOptions.else
    };
    expect(ROSLIB.Topic).toHaveBeenCalledWith(expectedTopicOptions);
  });

  test('has a shortcut for creating string topics', () => {
    jest.spyOn(ROSLIB, 'Topic').mockImplementation();
    let rosConnection = {};
    let topicName = 'test-topic-name';

    RoslibService.instance.createStringTopic(rosConnection, topicName);
    let expectedTopicOptions = {
      ros: rosConnection,
      name: topicName,
      messageType: 'std_msgs/String'
    };
    expect(ROSLIB.Topic).toHaveBeenCalledWith(expectedTopicOptions);
  });

  test('can create ROS services with additional options', () => {
    let mockService = {};
    jest.spyOn(ROSLIB, 'Service').mockReturnValue(mockService);
    let rosConnection = {};
    let serviceName = 'test-topic-name';
    let additionalOptions = {
      something: {},
      else: true
    };

    let service = RoslibService.instance.createService(rosConnection, serviceName, additionalOptions);
    expect(service).toBe(mockService);
    let expectedTopicOptions = {
      ros: rosConnection,
      name: serviceName,
      serviceType: serviceName,
      something: additionalOptions.something,
      else: additionalOptions.else
    };
    expect(ROSLIB.Service).toHaveBeenCalledWith(expectedTopicOptions);
  });
});
