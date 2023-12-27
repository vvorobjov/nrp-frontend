/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';

import MqttClientService from '../mqtt-client-service';
import mqtt from 'mqtt';
import { EventEmitter } from 'events';

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

  test('sub/unsub', () => {

    // Mock the 'connect' function of the 'mqtt' module
    mqtt.connect.mockImplementation(() => {
      const mqttClient = new EventEmitter();

      // Mock the 'subscribe' function of the created MQTT client
      mqttClient.subscribe = jest.fn().mockImplementation((topic, callback) => {
        // Your custom mock logic for the 'subscribe' function
        console.log(`Mocked subscribe function called with topic: ${topic}`);
        // You can customize the behavior or return value of the 'subscribe' function here
      });

      return mqttClient;
    });

    let topicA = '/nrp_simulation/0/status';
    let topicB = '/nrp_simulation/1/status';

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
});