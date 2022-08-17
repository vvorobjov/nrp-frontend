import mqtt from 'mqtt';
import { EventEmitter } from 'events';

//import * as proto from 'nrp-jsproto/nrp-engine_msgs-protobuf.js';
//import { DataPackMessage } from 'nrp-jsproto/nrp-engine_msgs-protobuf.js';
import jspb from '../../node_modules/google-protobuf/google-protobuf';

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

    this.subTokensMap = new Map();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new MqttClientService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  connect(brokerUrl) {
    console.info('MQTT connecting to ' + brokerUrl + ' ...');
    this.client = mqtt.connect(brokerUrl);
    this.client.on('connect', () => {
      console.info('... MQTT connected');
      console.info(this.client);
      this.emit(MqttClientService.EVENTS.CONNECTED, this.client);
    });
    this.client.on('error', this.onError);
    this.client.on('message', (params) => {
      this.onMessage(params);
    });
  }

  onError(error) {
    console.error(error);
  }

  onMessage(topic, payload, packet) {
    //console.info('MQTT message: [topic, payload, packet]');
    //console.info([topic, payload, packet]);
    //Now we see which callbacks have been assigned for a topic
    if (typeof this.subTokensMap.get(topic) !== 'undefined') {
      for (var token in this.subTokensMap.get(topic)){
        if (typeof token.callback === 'function' && payload !== 'undefined') {
          //Deserializatin of Data must happen here
          token.callback(payload);
        }
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
  CONNECTED: 'CONNECTED'
});