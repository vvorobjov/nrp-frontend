import { EventEmitter } from 'events';

import MqttClientService from '../../services/mqtt-client-service';
import DialogService from '../../services/dialog-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling server resources for simulating experiments.
 */
class ExperimentWorkbenchService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this._simulationID = undefined;
    this._errorToken = undefined;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentWorkbenchService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  get experimentInfo() {
    return this._expInfo;
  }
  set experimentInfo(info) {
    this._expInfo = info;
    console.info(['ExperimentWorkbenchService - experimentInfo', this._expInfo]);
  }

  get experimentID() {
    return this._experimentID;
  }
  set experimentID(experimentID) {
    this._experimentID = experimentID;
    console.info(['ExperimentWorkbenchService - experimentID', this._experimentID]);
  }

  get simulationID() {
    return this._simulationID;
  }
  set simulationID(simulationID) {
    this._simulationID = simulationID;
    console.info(['ExperimentWorkbenchService - simulationID', this._simulationID]);
    ExperimentWorkbenchService.instance.emit(
      ExperimentWorkbenchService.EVENTS.SIMULATION_SET,
      this._simulationID
    );
    this.setTopic(this._simulationID);
  }

  setTopic = (simulationID) => {
    if (this._errorToken) {
      MqttClientService.instance.unsubscribe(this._errorToken);
      this._errorToken = undefined;
    }
    if (simulationID) {
      const errorTopic = MqttClientService.instance.getConfig().mqtt.topics.base + '/'
        + simulationID + '/'
        + MqttClientService.instance.getConfig().mqtt.topics.errors;
      const errorToken = MqttClientService.instance.subscribeToTopic(errorTopic, this.errorMsgHandler);
      this._errorToken = errorToken;
    }
  }

  errorMsgHandler = (msg) => {
    // TODO: parse error message
    DialogService.instance.warningNotification({ message: msg.toString() });
  }
}

export default ExperimentWorkbenchService;

ExperimentWorkbenchService.EVENTS = Object.freeze({
  SIMULATION_SET: 'SIMULATION_SET'
});
