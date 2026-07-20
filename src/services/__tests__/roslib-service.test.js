/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import * as ROSLIB from 'roslib';
import RoslibService from '../roslib-service';
import AuthenticationService from '../authentication-service';

// Auto-mock roslib so ROSLIB.Ros does not open a real socket (which crashes the
// node test process — the reason the legacy suite below is skipped).
jest.mock('roslib');

// EBR2-108: the connection cache must be keyed by the clean URL (not a
// token-bearing URL) and a refreshed auth token must produce a fresh
// connection; createService must use a real ROS service type, not the name.
describe('RoslibService (EBR2-108)', () => {
  afterEach(() => {
    // Drop cached connections so each test starts clean (singleton state).
    RoslibService.instance.connections.clear();
    jest.restoreAllMocks();
  });

  test('caches connections by clean URL and reuses them for the same token', async () => {
    jest.spyOn(AuthenticationService.instance, 'getToken').mockReturnValue('tok-1');

    const c1 = await RoslibService.instance.getConnection('ws://ros');
    const c2 = await RoslibService.instance.getConnection('ws://ros');

    expect(c1).toBe(c2);
    expect(ROSLIB.Ros).toHaveBeenCalledTimes(1);
    // token baked into the connection URL, not into the cache key
    expect(ROSLIB.Ros).toHaveBeenCalledWith({ url: 'ws://ros?token=tok-1' });
    // the map key is the clean URL
    expect(RoslibService.instance.connections.has('ws://ros')).toBe(true);
  });

  test('recreates the connection when the auth token changes', async () => {
    const getTokenSpy = jest.spyOn(AuthenticationService.instance, 'getToken');

    getTokenSpy.mockReturnValue('tok-A');
    await RoslibService.instance.getConnection('ws://ros');
    getTokenSpy.mockReturnValue('tok-B');
    await RoslibService.instance.getConnection('ws://ros');

    expect(ROSLIB.Ros).toHaveBeenCalledTimes(2);
    expect(ROSLIB.Ros).toHaveBeenLastCalledWith({ url: 'ws://ros?token=tok-B' });
    // still a single cache entry for the clean URL
    expect(RoslibService.instance.connections.size).toBe(1);
  });

  test('createService uses the provided ROS service type, not the service name', () => {
    const connection = {};
    RoslibService.instance.createService(connection, '/my_service', 'my_pkg/MySrv', { extra: 1 });

    expect(ROSLIB.Service).toHaveBeenCalledWith({
      ros: connection,
      name: '/my_service',
      serviceType: 'my_pkg/MySrv',
      extra: 1
    });
  });
});

describe('RoslibService', () => {
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

  // Connection caching is covered by the EBR2-108 suite above; the legacy test
  // here treated getConnection as synchronous (it is now async), so it is dropped.

  test('can create ROS topics with additional options', () => {
    let mockTopic = {};
    ROSLIB.Topic.mockImplementation(() => mockTopic);
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

  // createService is covered by the EBR2-108 suite above; the legacy test here
  // asserted the old buggy signature (serviceType defaulted to the name), which
  // no longer holds after the EBR2-108 fix, so it is dropped.
});
