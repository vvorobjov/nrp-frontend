import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerService from './data-visualizer-service';
import IDataVisualizerAdapter from './interface-data-visualizer-adapter';
import MqttClientService from '../../mqtt-client-service';
import * as proto from 'nrp-jsproto/nrp-engine_msgs-protobufjs';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * ROS adapter taking care of communication between gazebo and the data visualizer
 * It establishes, maintaines and closes ROS connections to topics with parameters:
 * - supported types: data (Float and Int)
 * - model points frequency: update rate (2)
 */
export default class DataVisualizerNrpProtoAdapter extends IDataVisualizerAdapter {
  constructor(enforcer) {
    super();

    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this.supportedTypes = ['joint'];
    this.subscribedTopics = [];
    this.dataSources = {};
    this.rosConnection = undefined;
    this.modelPointsFrequency = 2;
    this.sortedTopics = [];
    this.loadSettingsWhenTopic = true;
    this.modelStateLastTime = undefined;
    this.modelStateUpdateRate = DataVisualizerNrpProtoAdapter.CONSTANTS.TOPIC_MODEL_STATES_UPDATE_RATE_DEFAULT;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerNrpProtoAdapter(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async updateDataSources(serverURL, simulationID) {
    let mqttTopics = MqttClientService.instance.topics;
    this.dataSources = {};
    for (let mqttTopic of mqttTopics) {
      if (mqttTopic.endsWith('/type')) {
        let topicType = 'TODO: find topic type, clarify mechanism for NRP-Core to specify this';
        if (this.supportedTypes.includes(topicType)) {
          let topic = mqttTopic.substring(0, mqttTopic.length - 5);
          this.dataSources[topic] = topicType;
        }
      }
    }
    this.sortedTopics = Object.keys(this.dataSources);
    this.sortedTopics.sort();
    DataVisualizerService.instance.sendSortedSources(this.sortedTopics);
    if (this.loadSettingsWhenTopic) {
      this.loadSettingsWhenTopic = false;
      DataVisualizerService.instance.sendSettings(UserSettingsService.instance.settingsData);
    }
  }

  connect(serverConfig) {
    this.rosConnection = MqttClientService.instance.connect(/*serverConfig.mqttBrokerURL*/);
  }

  sendStandardMessage(message) {
    DataVisualizerService.instance.sendStandardMessage(message, this.dataSources);
  }

  sendStateMessage(message) {
    DataVisualizerService.instance.sendStateMessage(message, this.dataSources);
  }

  subscribeTopics(plotStructure) {
    //TODO: nrp-core structure needs to be in place
  }

  unsubscribeTopics() {
    this.subscribedTopics.forEach(connection => {
      connection.unsubscribe(message => {
        this.sendStandardMessage(message);
      });
      connection.unsubscribe(message => {
        this.sendStateMessage(message);
      });
    });
    this.subscribedTopics = [];
    this.rosConnection = undefined;
  }
}

DataVisualizerNrpProtoAdapter.CONSTANTS = Object.freeze({});