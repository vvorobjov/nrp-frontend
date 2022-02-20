import mqtt from 'mqtt';
import { EventEmitter } from 'events';

import 'nrp-jsproto/nrp-jsproto';

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

    //console.info(proto);
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
    });
    this.client.on('error', this.onError);
    this.client.on('message', this.onMessage);
  }

  onError(error) {
    console.error(error);
  }

  onMessage(topic, payload, packet) {
    console.info('MQTT message: [topic, payload, packet]');
    console.info([topic, payload, packet]);

    /*try {
      let dump =
    }*/
  }
}

MqttClientService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED'
});