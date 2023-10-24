import { EventEmitter } from 'events';

import MqttClientService from '../../services/mqtt-client-service';
import DialogService from '../../services/dialog-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service.js';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling the state of the experiment workbench and the current running simulation
 * Service handling the state of the experiment workbench and the current running simulation
 */
class ExperimentWorkbenchService extends EventEmitter {
class ExperimentWorkbenchService extends EventEmitter {
  constructor(enforcer) {
    super();
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this._simulationInfo = undefined;
    this._serverURL = undefined;
    this._errorToken = undefined;
    this._statusToken = undefined;
    this._xpraUrlsConfig = [];
    this._xpraUrlsConfirmed = [];

    ExperimentStorageService.instance.addListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      async () => {
        let experiments = await ExperimentStorageService.instance.getExperiments();
        const experimentInfo = experiments.find(experiment => experiment.id === this.experimentID);
        this.experimentInfo = experimentInfo;
      });
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentWorkbenchService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  get experimentInfo() {
    return this._expInfo;
    return this._expInfo;
  }
  set experimentInfo(info) {
    this._expInfo = info;
    //console.info(['ExperimentWorkbenchService - experimentInfo', this._expInfo]);
  }

  get experimentID() {
    return this._experimentID;
  }
  set experimentID(experimentID) {
    this._experimentID = experimentID;
    //console.info(['ExperimentWorkbenchService - experimentID', this._experimentID]);
  }

  get serverURL() {
    return this._serverURL;
  }
  set serverURL(serverURL) {
    this._serverURL = serverURL;
    //console.info(['ExperimentWorkbenchService - serverURL', this._serverURL]);
  }

  get simulationState() {
    return this._simulationState;
  }
  set simulationState(state) {
    this._simulationState = state;
  }

  /**
   * Returns the simulation MQTT description
   * @returns {object} the simulation info
   * @returns {string} simulationInfo.ID the simulation ID
   * @returns {string} simulationInfo.MQTTPrefix the simulation MQTT Prefix
   */
  get simulationInfo() {
    return this._simulationInfo;
  }
  set simulationInfo(simulationInfo) {
    this._simulationInfo = simulationInfo;
    //console.info(['ExperimentWorkbenchService - simulationInfo', this._simulationInfo]);
    ExperimentWorkbenchService.instance.emit(
      ExperimentWorkbenchService.EVENTS.SIMULATION_SET,
      this._simulationInfo
    );
    this.setTopics(this._simulationInfo);
  }

  get xpraConfigUrls() {
    return this._xpraUrlsConfig;
  }
  set xpraConfigUrls(urls) {
    this._xpraUrlsConfig = urls;
    //console.info(['ExperimentWorkbenchService - xpraUrls', this._xpraConfigUrls]);
  }

  get xpraUrls() {
    return this._xpraUrlsConfirmed;
  }

  async confirmXpraUrls() {
    console.info('confirmXpraUrls');
    const simState = this.simulationState;
    if (!this._xpraUrlsConfig || this._xpraUrlsConfig.length === 0
        || !simState || simState === EXPERIMENT_STATE.CREATED
        || simState === EXPERIMENT_STATE.UNDEFINED || simState === EXPERIMENT_STATE.FAILED) {
      return;
    }
    else {
      let confirmedUrls = [];
      for (let url of this._xpraUrlsConfig) {
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
          confirmedUrls.push(url);
        }
      }
      this._xpraUrlsConfirmed = confirmedUrls;
    }
  }

  /**
   * Gather experiment information.
   * @param experimentID The experiment's ID
   */
  async initExperimentInformation(experimentID) {
    this.experimentID = experimentID;
    let experiments = await ExperimentStorageService.instance.getExperiments();
    if (experiments) {
      const experimentInfo = experiments.find(experiment => experiment.id === experimentID);
      this.experimentInfo = experimentInfo;

      if (experimentInfo.joinableServers.length === 1) {
        const runningSimulation = experimentInfo.joinableServers[0].runningSimulation;
        if (runningSimulation) {
          let serverConfig = await ServerResourcesService.instance.getServerConfig(
            experimentInfo.joinableServers[0].server);
          this.serverURL = serverConfig['nrp-services'];
          this.xpraConfigUrls = [serverConfig.xpra];
          this.simulationInfo = {
            ID: runningSimulation.simulationID,
            MQTTPrefix: runningSimulation.MQTTPrefix
          };
        }
      }
    }
  }

  /**
   * Returns the MQTT broker connection status
   * @returns {boolean} the MQTT broker connection status
   */
  mqttConnected() {
    return MqttClientService.instance.isConnected();
  }

  setTopics = (simulationInfo) => {
    if (this._errorToken) {
      MqttClientService.instance.unsubscribe(this._errorToken);
      this._errorToken = undefined;
    }
    if (this._statusToken) {
      MqttClientService.instance.unsubscribe(this._statusToken);
      this._statusToken = undefined;
    }
    if (simulationInfo !== undefined) {
      const mqttTopics = MqttClientService.instance.getConfig().mqtt.topics;
      const topicBase = simulationInfo.MQTTPrefix ?
        simulationInfo.MQTTPrefix + '/' + mqttTopics.base + '/' + simulationInfo.ID + '/' :
        mqttTopics.base + '/' + simulationInfo.ID + '/';
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
        let oldState = this.simulationState;
        this.simulationState = status.state;
        if (status.state !== oldState) {
          this.confirmXpraUrls();
        }

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

ExperimentWorkbenchService.EVENTS = Object.freeze({
  SIMULATION_SET: 'SIMULATION_SET',
  SIMULATION_STATUS_UPDATED: 'SIMULATION_STATUS_UPDATED'
});
