import mqtt from 'mqtt';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling state and info of running simulations.
 */
export default class MqttClientService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
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

    this.client.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  onError(error) {
    console.error(error);
  }

  onMessage(topic, payload, packet) {
    console.info('MQTT message');
    console.info(topic);
    console.info(payload);
    console.info(packet);
  }
}