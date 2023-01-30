import { EventEmitter } from 'events';

import MqttClientService from '../../services/mqtt-client-service';
import DialogService from '../../services/dialog-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling the state of the experiment workbench and the current running simulation
 */
class ExperimentWorkbenchService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this._simulationID = undefined;
    this._serverURL = undefined;
    this._errorToken = undefined;
    this._statusToken = undefined;
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

  get serverURL() {
    return this._serverURL;
  }
  set serverURL(serverURL) {
    this._serverURL = serverURL;
    console.info(['ExperimentWorkbenchService - serverURL', this._serverURL]);
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
    this.setTopics(this._simulationID);
  }

  setTopics = (simulationID) => {
    if (this._errorToken) {
      MqttClientService.instance.unsubscribe(this._errorToken);
      this._errorToken = undefined;
    }
    if (this._statusToken) {
      MqttClientService.instance.unsubscribe(this._statusToken);
      this._statusToken = undefined;
    }
    if (simulationID !== undefined) {
      const topicBase = MqttClientService.instance.getConfig().mqtt.topics.base + '/'
        + simulationID + '/';
      // assign error MQTT topic
      const errorTopic = topicBase + MqttClientService.instance.getConfig().mqtt.topics.errors;
      const errorToken = MqttClientService.instance.subscribeToTopic(errorTopic, this.errorMsgHandler);
      this._errorToken = errorToken;

      // assign status MQTT topic
      const statusTopic = topicBase + MqttClientService.instance.getConfig().mqtt.topics.status;
      const statusToken = MqttClientService.instance.subscribeToTopic(statusTopic, this.statusMsgHandler);
      this._statusToken = statusToken;
    }
  }

  /**
   * The handler emitting the new simulation error
   *
   * @emits DialogService.EVENTS.ERROR
   *
   * @param {string} msg is a string representing the error object
   * @param {float}  msg.sim_id is the ID of the simulation
   * @param {float}  msg.msg is the error message
   * @param {string} msg.error_type is the error type
   * @param {float}  msg.fileName is the filename with the error
   * @param {float}  msg.line_number is the line with the error
   * @param {float}  msg.line_text is the text with the error
   */
  errorMsgHandler = (msg) => {
    const msgObj = JSON.parse(msg);
    const err = {
      message: msgObj.msg,
      code: msgObj.error_type,
      stack: `${msgObj.fileName}:${msgObj.line_number}:${msgObj.line_text}\n`
    };
    DialogService.instance.simulationError(err);
  }

  /**
   * The handler emitting the new simulation status
   *
   * @emits ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED
   *
   * @param {string} msg is a string representing status object
   * @param {float}  msg.realTime is the real time of the simulation
   * @param {float}  msg.simulationTime is the simulation time of the simulation
   * @param {string} msg.state is the simulation state
   * @param {float}  msg.simulationTimeLeft is the time left until timeout
   */
  statusMsgHandler = (msg) => {
    try {
      const status = JSON.parse(msg);
      if (status.state) {
        ExperimentWorkbenchService.instance.emit(
          ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
          status
        );
      }
    }
    catch (err) {
      DialogService.instance.unexpectedError({
        message: 'Could not parse the status MQTT message:\n' + msg.toString(),
        data: err.toString()
      });
    }
  }
}

export default ExperimentWorkbenchService;

ExperimentWorkbenchService.EVENTS = Object.freeze({
  SIMULATION_SET: 'SIMULATION_SET',
  SIMULATION_STATUS_UPDATED: 'SIMULATION_STATUS_UPDATED'
});
