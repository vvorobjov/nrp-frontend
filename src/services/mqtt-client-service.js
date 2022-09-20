import mqtt from 'mqtt';
import { EventEmitter } from 'events';

//import { DataPackMessage } from 'nrp-jsproto/engine_grpc_pb';
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
    if (this.client && brokerUrl && brokerUrl === this.client.options.href) {
      console.info('MQTT client already connected to ' + brokerUrl);
      return;
    }

    if (!brokerUrl) {
      brokerUrl = this.defaultBrokerURL;
    }
    this.topicsSYS = [];
    this.topics = [];

    console.info('MQTT connecting to ' + brokerUrl + ' ...');
    this.client = mqtt.connect(brokerUrl);
    this.client.on('connect', () => {
      console.info('... MQTT connected');
      console.info(this.client);
      this.emit(MqttClientService.EVENTS.CONNECTED, this.client);
    });
    this.client.on('error', this.onError);
    this.client.on('message', (topic, payload, packet) => this.onMessage(topic, payload, packet));
  }

  onError(error) {
    console.error(error);
  }

  onMessage(topic, payload, packet) {
    if (typeof payload === 'undefined') {
      return;
    }

    //console.info('MQTT message: [topic, payload, packet]');
    //console.info([topic, payload, packet]);
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
    //console.info('You have been subscribed to topic ' + topic);
    //console.info(this.subTokensMap);
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
  CONNECTED: 'CONNECTED'
});