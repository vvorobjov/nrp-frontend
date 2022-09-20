/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';

import MqttClientService from '../mqtt-client-service';

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
