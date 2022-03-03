import mqtt from 'mqtt';
import { EventEmitter } from 'events';

//import * as proto from 'nrp-jsproto/nrp-engine_msgs-protobufjs';
import { DataPackMessage } from 'nrp-jsproto/engine_msgs_pb';
import jspb from 'google-protobuf';

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

    console.info(DataPackMessage);
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
    this.client.on('message', this.onMessage);
  }

  onError(error) {
    console.error(error);
  }

  onMessage(topic, payload, packet) {
    /*console.info('MQTT message: [topic, payload, packet]');
    console.info([topic, payload, packet]);*/

    try {
      if (topic.endsWith('/type')) {
        let msg = String(payload);
        console.info('"' + topic + '" message format = ' + msg);
      }
      else {
        //let msg = proto.Engine.DataPackMessage.decode(payload);
        let msg = DataPackMessage.deserializeBinary(payload);
        console.info('DataPackMessage');
        console.info(msg);

        console.info(['getDataPackMessageOneofCaseString', MqttClientService.getDataPackMessageOneofCaseString(msg)]);
        console.info(['getProtoOneofData', MqttClientService.getProtoOneofData(msg, msg.getDataCase())]);

        let msgObject = msg.toObject();
        console.info(msgObject);
        //console.info(['msg.computeOneofCase', jspb.Message.computeOneofCase(msg, msg.getDataCase())]);
      }
    }
    catch (error) {
      console.error(error);
    }
  }

  static getProtoOneofData(protoMsg, oneofCaseNumber) {
    return jspb.Message.getField(protoMsg, oneofCaseNumber);
  }

  static getDataPackMessageOneofCaseString(protoMsg) {
    for (let dataCase in DataPackMessage.DataCase) {
      if (DataPackMessage.DataCase[dataCase] === protoMsg.getDataCase()) {
        return dataCase;
      }
    }
  }
}

MqttClientService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED'
});