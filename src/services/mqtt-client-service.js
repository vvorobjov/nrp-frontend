import mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

//import { DataPackMessage } from 'nrp-jsproto/engine_grpc_pb';
import jspb from '../../node_modules/google-protobuf/google-protobuf';

import frontendConfig from '../config.json';
import ExperimentWorkbenchService from '../components/experiment-workbench/experiment-workbench-service';

const REGEX_TOPIC_DATATYPES = /[./]?nrp_simulation\/[0-9]+\/data$/;
const REGEX_SIMULATION_STATUS = /nrp_simulation\/[0-9]+\/status/;
const REGEX_SIMULATION_ERROR = /nrp_simulation\/[0-9]+\/runtime_error/;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling state and info of running simulations.
 */
export default class MqttClientService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.config = frontendConfig;
    this.connect = this.connect.bind(this);

    this.state = {
      isConnected: false
    };
    this.connectionState = MqttClientService.CONNECTION_STATES.DISCONNECTED;

    this.subTokensMap = new Map();

    // Since it's a singleton, shoud the url be defined here?
    const websocket_s = frontendConfig.mqtt.websocket ? frontendConfig.mqtt.websocket : 'ws';
    this.mqttBrokerUrl = websocket_s + '://' + frontendConfig.mqtt.url + ':' + frontendConfig.mqtt.port;

    this.connect();

  }

  static get instance() {
    if (_instance == null) {
      _instance = new MqttClientService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  isConnected() {
    return this.connectionState === MqttClientService.CONNECTION_STATES.CONNECTED;
  }

  /**
   * @returns {string} the current connection state, one of
   * MqttClientService.CONNECTION_STATES.
   */
  getConnectionState() {
    return this.connectionState;
  }

  getBrokerURL() {
    return this.mqttBrokerUrl;
  }

  getConfig() {
    return this.config;
  }

  connect() {
    console.info('MQTT connecting to ' + this.mqttBrokerUrl + ' ...');
    this.client = mqtt.connect(this.mqttBrokerUrl, { clientId: 'nrp-frontend_' + uuidv4() });
    // Track the full lifecycle so a lost connection is actually detected and
    // surfaced (previously only 'connect' and a bare 'disconnect' were handled,
    // so drops/offline/reconnect went unnoticed).
    this.client.on('connect', () => this.onConnect());
    this.client.on('reconnect', () => this.onReconnect());
    this.client.on('close', () => this.onClose());
    this.client.on('offline', () => this.onOffline());
    this.client.on('error', (error) => this.onError(error));
    this.client.on('disconnect', () => this.onDisconnect());
    this.client.on('message', (topic, message) => {
      this.onMessage(topic, message);
    });
  }

  /**
   * Update the tracked connection state and notify listeners. Emits a single
   * DISCONNECTED event when an established connection is lost.
   *
   * @param {string} state one of MqttClientService.CONNECTION_STATES
   */
  setConnectionState(state) {
    const previous = this.connectionState;
    if (previous === state) {
      return;
    }
    this.connectionState = state;
    this.state.isConnected = (state === MqttClientService.CONNECTION_STATES.CONNECTED);
    this.emit(MqttClientService.EVENTS.CONNECTION_STATE_CHANGED, state);
    if (previous === MqttClientService.CONNECTION_STATES.CONNECTED &&
      state !== MqttClientService.CONNECTION_STATES.CONNECTED) {
      this.emit(MqttClientService.EVENTS.DISCONNECTED, state);
    }
  }

  onError(error) {
    console.error(error);
    this.setConnectionState(MqttClientService.CONNECTION_STATES.ERROR);
    this.emit(MqttClientService.EVENTS.ERROR, error);
  }

  onReconnect() {
    console.info('... MQTT reconnecting');
    this.setConnectionState(MqttClientService.CONNECTION_STATES.RECONNECTING);
    this.emit(MqttClientService.EVENTS.RECONNECTING);
  }

  onClose() {
    console.info('... MQTT connection closed');
    this.setConnectionState(MqttClientService.CONNECTION_STATES.DISCONNECTED);
  }

  onOffline() {
    console.info('... MQTT offline');
    this.setConnectionState(MqttClientService.CONNECTION_STATES.OFFLINE);
  }

  onDisconnect() {
    console.info('... MQTT disconnected');
    this.setConnectionState(MqttClientService.CONNECTION_STATES.DISCONNECTED);
  }

  onConnect() {
    console.info('... MQTT connected');
    this.setConnectionState(MqttClientService.CONNECTION_STATES.CONNECTED);
    // TODO: filter nrp messages
    this.client.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
    this.emit(MqttClientService.EVENTS.CONNECTED, this.client);
  }

  onMessage(topic, payload, packet) {
    /*console.info('MqttClientService.onMessage() - topic=' + topic);*/
    if (typeof payload === 'undefined') {
      return;
    }

    //Now we see which callbacks have been assigned for a topic
    let subTokens = this.subTokensMap.get(topic);
    if (typeof subTokens !== 'undefined') {
      let msg;
      if (REGEX_TOPIC_DATATYPES.test(topic)) {
        try {
          msg = JSON.parse(payload.toString());
        }
        catch (error) {
          console.error(error);
          console.error(payload.toString());
        }
      }
      else if (REGEX_SIMULATION_STATUS.test(topic)) {
        msg = payload;
      }
      else if (REGEX_SIMULATION_ERROR.test(topic)) {
        // runtime_error is a JSON payload, not protobuf. Without this branch it
        // fell through to the protobuf path below, found no message class, and
        // returned without ever invoking the callback — so simulation errors
        // were silently swallowed and never shown to the user (EBR2-89).
        msg = payload;
      }
      else {
        let protoMessage = ExperimentWorkbenchService.instance.getProtoMsgFromTopic(topic);
        if (typeof protoMessage === 'undefined') {
          console.error('could not find protobuf message class for topic "'
            + topic + '" (' + ExperimentWorkbenchService.instance.getTopicType(topic) + ')');
          return;
        }
        let deserialized = protoMessage.deserializeBinary(payload);
        let object = deserialized.toObject();
        msg = object;
      }

      for (var token of subTokens) {
        //Deserializatin of Data must happen here
        token.callback(msg);
      };
    };

  }

  /**
   * Subscribes to an MQTT topic and associates a callback function with it.
   *
   * @param {string} topic - The MQTT topic to subscribe to.
   * @param {function} callback - The callback function to be invoked when a message is received
   * on the subscribed topic. Should have parameters `topic` and `payload`.
   * @returns {Object} token - A token object representing the subscription,
   *                           containing the subscribed `topic` and `callback`.
   */
  subscribeToTopic(topic, callback) {
    // this.client is mocked with EventEmitter in tests
    if (!(this.client instanceof mqtt.MqttClient)) {
      if (typeof this.client.subscribe === 'function' && this.client instanceof EventEmitter) {
        console.info('the MQTT client is under test as this.client is of type EventEmitter.');
      }
      else {
        console.error('the MQTT client is not initialized while subscribing to topic!');
        return;
      }
    }
    if (typeof callback !== 'function') {
      console.error('trying to subscribe to topic "' + topic + '", but no callback function given!');
      return;
    }

    const token = {
      topic: topic,
      callback: callback
    };

    // Check if the topic is already subscribed
    if (this.subTokensMap.has(token.topic)){
      this.subTokensMap.get(token.topic).push(token);
    }
    // If not subscribed, create a new entry in the map and subscribe to the topic
    else{
      this.subTokensMap.set(
        token.topic,
        [token]
      );
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
    return token;
  }

  unsubscribe(unsubToken) {
    if (this.subTokensMap.has(unsubToken.topic)){
      let tokens = this.subTokensMap.get(unsubToken.topic);
      let index = tokens.indexOf(unsubToken);
      if (index !== -1) {
        tokens.splice(index, 1);
      }
      else {
        console.warn('Your provided token could not be found in the subscription list');
      }
    }
    else{
      console.warn('The topic ' + unsubToken.topic + ' was not found');
    }
  }

  static getProtoOneofData(protoMsg, oneofCaseNumber) {
    return jspb.Message.getField(protoMsg, oneofCaseNumber);
  }

  /*static getDataPackMessageOneofCaseString(protoMsg) {
    for (let dataCase in DataPackMessage.DataCase) {
      if (DataPackMessage.DataCase[dataCase] === protoMsg.getDataCase()) {
        return dataCase;
      }
    }
  }*/
}

MqttClientService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
  CONNECTION_STATE_CHANGED: 'CONNECTION_STATE_CHANGED'
});

MqttClientService.CONNECTION_STATES = Object.freeze({
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
});