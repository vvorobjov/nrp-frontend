import mqtt from 'mqtt';
import { EventEmitter } from 'events';

import * as proto from 'nrp-jsproto/nrp-engine_msgs-protobufjs';

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
    this.defaultBrokerURL = 'ws://' + window.location.hostname + ':1884'; //TODO: move to config once set in place
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
    /*console.info('MQTT message: [topic, payload, packet]');
    console.info([topic, payload, packet]);*/

    //TODO: this is actually highly inefficient and fundamentally relies on being subsribed to '#' and '$SYS/#'
    // meaning you also receive every message, whether relevant or not.
    // unfortunately mosquitto doesn't offer a listing of topics, this should be discussed.
    // possibly a reserved topic is introduced that holds information on all available topics
    // e.g. $SYS/topics or <client-id>/topics.
    if (topic.startsWith('$SYS')) {
      if (!this.topicsSYS.includes(topic)) {
        this.topicsSYS.push(topic);
        this.topicsSYS.sort();
        console.info(['topicsSYS', this.topicsSYS]);
      }
    }
    else {
      if (!this.topics.includes(topic)) {
        this.topics.push(topic);
        this.topics.sort();
        console.info(['topics', this.topics]);
      }
    }

    try {
      if (topic.endsWith('/type')) {
        let msg = String(payload);
        console.info('"' + topic + '" message format = ' + msg);
      }
      else if (!topic.startsWith('$SYS')) {
        let msg = proto.Engine.DataPackMessage.decode(payload);
        console.info(['DataPackMessage', msg]);
      }
    }
    catch (error) {
      console.error(error);
    }
  }
}

MqttClientService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED'
});