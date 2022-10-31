import mqtt from 'mqtt';
import { EventEmitter } from 'events';

//import { DataPackMessage } from 'nrp-jsproto/engine_grpc_pb';
import jspb from '../../node_modules/google-protobuf/google-protobuf';

import frontendConfig from '../config.json';

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

    this.subTokensMap = new Map();

    // Since it's a singleton, shoud the url be defined here?
    this.mqttBrokerUrl = 'ws://' + frontendConfig.mqtt.url + ':' + frontendConfig.mqtt.port;

    this.connect();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new MqttClientService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  isConnected() {
    return this.client.connected;
  }

  getBrokerURL() {
    return this.mqttBrokerUrl;
  }

  getConfig() {
    return this.config;
  }

  connect() {
    console.info('MQTT connecting to ' + this.mqttBrokerUrl + ' ...');
    this.client = mqtt.connect(this.mqttBrokerUrl, { clientId: 'nrp-frontend'});
    this.client.on('connect', () => {
      this.onConnect();
    });
    this.client.on('error', this.onError);
    // TODO: fetch disconnection event properly
    this.client.on('disconnect', () => {
      console.info('... MQTT disconnected');
      this.emit(MqttClientService.EVENTS.DISCONNECTED);
    });
    this.client.on('message', (topic, message) => {
      this.onMessage(topic, message);
    });
  }

  // disconnect(brokerUrl) {
  //   console.info('MQTT disconnecting ' + brokerUrl);
  //   if (this.client){
  //     this.client.on('disconnect', () => {
  //       console.info('... MQTT disconnected');
  //       this.emit(MqttClientService.EVENTS.DISCONNECTED);
  //     });
  //     this.client.disconnect();
  //   }
  // }

  onError(error) {
    console.error(error);
  }

  onConnect() {
    console.info('... MQTT connected');
    console.info(this.client);
    // TODO: filter nrp messages
    this.client.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
    this.emit(MqttClientService.EVENTS.CONNECTED, this.client);
  }

  onMessage(topic, payload, packet) {
    if (typeof payload === 'undefined') {
      return;
    }

    console.info('MQTT message: [topic, payload, packet]');
    console.info([topic, payload, packet]);
    //Now we see which callbacks have been assigned for a topic
    let subTokens = this.subTokensMap.get(topic);
    if (typeof subTokens !== 'undefined') {
      for (var token of subTokens) {
        //Deserializatin of Data must happen here
        token.callback(payload);
      };
    };

    /*try {
      if (topic.endsWith('/type')) {
        let msg = String(payload);
        console.info('"' + topic + '" message format = ' + msg);
      }
      else {
        let msg = DataPackMessage.deserializeBinary(payload);
        console.info('DataPackMessage');
        console.info(msg);
      }
    }
    catch (error) {
      console.error(error);
    }*/
  }

  //callback should have args topic, payload
  subscribeToTopic(topic, callback) {
    if (typeof callback !== 'function') {
      console.error('trying to subscribe to topic "' + topic + '", but no callback function given!');
      return;
    }

    const token = {
      topic: topic,
      callback: callback
    };
    if (this.subTokensMap.has(token.topic)){
      this.subTokensMap.get(token.topic).push(token);
    }
    else{
      this.subTokensMap.set(
        token.topic,
        [token]
      );
    }
    console.info('You have been subscribed to topic ' + topic);
    console.info(this.subTokensMap);
    return token;
  }

  unsubscribe(unsubToken) {
    if (this.subTokensMap.has(unsubToken.topic)){
      let tokens = this.subTokensMap.get(unsubToken.topic);
      let index = tokens.indexOf(unsubToken);
      if (index !== -1) {
        tokens.splice(index, 1);
        //console.info('You have been unsubscribed from topic ' + unsubToken.topic);
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
  DISCONNECTED: 'DISCONNECTED'
});