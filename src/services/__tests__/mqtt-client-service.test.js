/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import mqtt from 'mqtt';
import { EventEmitter } from 'events';

import MqttClientService from '../mqtt-client-service';


jest.genMockFromModule('mqtt');
jest.mock('mqtt');

describe('MqttClientService', () => {

  let subscribeTopicAndValidate = (topic, callback) => {
    let token = MqttClientService.instance.subscribeToTopic(topic, callback);
    expect(token).toBeDefined();
    expect(token.topic).toBe(topic);
    expect(token.callback).toBe(callback);
    expect(MqttClientService.instance.subTokensMap.get(topic).includes(token)).toBeTruthy();

    return token;
  };

  let unsubscribeAndValidate = (token) => {
    MqttClientService.instance.unsubscribe(token);
    expect(MqttClientService.instance.subTokensMap.get(token.topic).includes(token)).toBeFalsy();
  };

  beforeEach(() => {
    // hide console output for tests
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'info').mockImplementation(() => { });
  });

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new MqttClientService();
    }).toThrow(Error);
    expect(() => {
      new MqttClientService();
    }).toThrowError(Error('Use MqttClientService.instance'));
  });

  test('connect, event callbacks', () => {
    mqtt.connect.mockImplementation(() => {
      return new EventEmitter();
    });
    jest.spyOn(MqttClientService.instance, 'onError');
    jest.spyOn(MqttClientService.instance, 'onMessage');

    let connectEventFired = false;
    MqttClientService.instance.on(MqttClientService.EVENTS.CONNECTED, () => {
      connectEventFired = true;
    });

    MqttClientService.instance.connect('test-url');
    let client = MqttClientService.instance.client;
    expect(client).toBeDefined();
    client.emit('connect');
    const mockError = {};
    client.emit('error', mockError);
    const mockMessage = {};
    client.emit('message', mockMessage);

    expect(connectEventFired).toBeTruthy();
    expect(MqttClientService.instance.onError).toHaveBeenCalledTimes(1);
    expect(MqttClientService.instance.onError).toHaveBeenCalledWith(mockError);
    expect(MqttClientService.instance.onMessage).toHaveBeenCalledTimes(1);
    expect(MqttClientService.instance.onMessage).toHaveBeenCalledWith(mockMessage);
  });

  test('sub/unsub', async () => {
    let topicA = 'topic/A';
    let topicB = 'topic/B';

    let sub1Callback = jest.fn();
    let sub1Token = subscribeTopicAndValidate(topicA, sub1Callback);
    let sub2Callback = jest.fn();
    let sub2Token = subscribeTopicAndValidate(topicA, sub2Callback);
    let sub3Callback = jest.fn();
    let sub3Token = subscribeTopicAndValidate(topicB, sub3Callback);

    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(2);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(1);

    MqttClientService.instance.onMessage(topicA, {});
    MqttClientService.instance.onMessage(topicB, {});
    expect(sub1Token.callback).toHaveBeenCalledTimes(1);
    expect(sub2Token.callback).toHaveBeenCalledTimes(1);
    expect(sub3Token.callback).toHaveBeenCalledTimes(1);

    unsubscribeAndValidate(sub1Token);
    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(1);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(1);

    MqttClientService.instance.onMessage(topicA, {});
    MqttClientService.instance.onMessage(topicB, {});
    expect(sub1Token.callback).toHaveBeenCalledTimes(1);
    expect(sub2Token.callback).toHaveBeenCalledTimes(2);
    expect(sub3Token.callback).toHaveBeenCalledTimes(2);

    unsubscribeAndValidate(sub2Token);
    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(0);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(1);

    MqttClientService.instance.onMessage(topicA, {});
    MqttClientService.instance.onMessage(topicB, {});
    expect(sub1Token.callback).toHaveBeenCalledTimes(1);
    expect(sub2Token.callback).toHaveBeenCalledTimes(2);
    expect(sub3Token.callback).toHaveBeenCalledTimes(3);

    unsubscribeAndValidate(sub3Token);
    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(0);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(0);

    MqttClientService.instance.onMessage(topicA, {});
    MqttClientService.instance.onMessage(topicB, {});
    expect(sub1Token.callback).toHaveBeenCalledTimes(1);
    expect(sub2Token.callback).toHaveBeenCalledTimes(2);
    expect(sub3Token.callback).toHaveBeenCalledTimes(3);
  });

  test('undefinedPayload', async () => {
    let topicA = 'topic/A';

    let sub1Callback = jest.fn();
    let sub1Token = subscribeTopicAndValidate(topicA, sub1Callback);
    MqttClientService.instance.onMessage(topicA, undefined);
    unsubscribeAndValidate(sub1Token);
    expect(sub1Token.callback).toHaveBeenCalledTimes(0);
  });

  test('CallbackIsNotFunction', async () => {
    let topicA = 'topic/A';

    let sub1Callback = undefined;
    let token = MqttClientService.instance.subscribeToTopic(topicA, sub1Callback);
    expect(token === undefined).toBeTruthy();
  });

  test('noToken/noTopic', async () => {
    let topicA = 'topic/A';
    let topicB = 'topic/B';
    let topicC = 'topic/C';

    let sub1Callback = jest.fn();
    let sub1Token = MqttClientService.instance.subscribeToTopic(topicA, sub1Callback);
    const sub2Token = {
      topic: topicB,
      callback: jest.fn()
    };

    MqttClientService.instance.unsubscribe(sub2Token);
    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(1);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(0);

    sub1Token.topic = topicC;
    MqttClientService.instance.unsubscribe(sub1Token);
    expect(MqttClientService.instance.subTokensMap.get(topicA).length).toBe(1);
    expect(MqttClientService.instance.subTokensMap.get(topicB).length).toBe(0);
    expect(MqttClientService.instance.subTokensMap.get(topicC) === undefined).toBeTruthy();
  });
});
