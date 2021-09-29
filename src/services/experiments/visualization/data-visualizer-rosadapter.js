import ServerResourcesService from '../execution/server-resources-service';
import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerService from './data-visualizer-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * ROS adapter taking care of communication between gazebo and the data visualizer
 */
export default class DataVisualizerROSAdapter {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use' + this.constructor.name + '.instance');
    }
    this.topicConnections = [];
    this.topics = [];
    this.roslib = undefined;
    this.rosConnection = undefined;
    this.modelPointsFrequency = 2;
    this.topics = [];
    this.sortedTopics = [];
    this.loadSettingsWhenTopic = true;
  }

  static get instanceAndLoadTopics() {
    if (_instance == null) {
      _instance = new DataVisualizerROSAdapter(SINGLETON_ENFORCER);
    }

    return this.instance;
  }

  async componentDidMount() {
    UserSettingsService.instance.settings.then(() => {
      ServerResourcesService.instance.getTopics(this.loadTopics);
    });
    this.settings = ServerResourcesService.instance.settingsData;
  }

  loadTopics(response) {
    this.topics = [{ Time: '_time' }];
    for (let i = 0; i < response.topics.length; i++) {
      if (this.supportedTypes.includes(response.topics[i].topicType)) {
        this.topics[response.topics[i].topic] = response.topics[i].topicType;
      }
    }
    this.sortedTopics = Object.keys(this.topics);
    this.sortedTopics.sort();
    if (this.loadSettingsWhenTopic) {
      this.loadSettingsWhenTopic = false;
      DataVisualizerService.instance.sendSettings(this.settings);
    }
  }

  getOrCreateConnection(server) {
    return this.roslib.getOrCreateConnection(server);
  }

  stateMessage (message) {
    DataVisualizerService.sendStateMessage(message, this.topics);
  }

  standardMessage (message) {
    DataVisualizerService.instance.sendStandardMessage(message);
  }

  subscribeTopics(plotStructure) {
    let topicSubscribed = {};
    for (
      let element = 0;
      element < plotStructure.plotElements.length;
      element++
    ) {
      for (
        let dimension = 0;
        dimension < plotStructure.plotElements[element].dimensions.length;
        dimension++
      ) {
        let topicName = plotStructure.plotElements[element].dimensions[dimension].source;
        let topicType = this.topics[topicName];
        if (topicType === '_time') {
          continue;
        }
        if (topicType === 'gazebo_msgs/ModelStates') {
          topicName = '/gazebo/model_states';
        }
        if (!(topicName in topicSubscribed))  {
          let topicSubscriber = this.roslib.createTopic(
            this.rosConnection,
            topicName,
            topicType,
            topicType === 'gazebo_msgs/ModelStates'
              ? {
                throttleRate: 1.0 / this.modelPointsFrequency * 1000.0
              }
              : undefined
          );
          topicSubscribed[topicName] = true;
          if (topicType === 'gazebo_msgs/ModelStates') {
            topicSubscriber.subscribe(this.stateMessage);
          }
          else {
            topicSubscriber.subscribe(this.standardMessage);
          }
          this.topicConnections = [...this.topicConnections, topicSubscriber];
        }
      }
    }
  }

  unsubscribeTopics() {
    this.topicConnections.forEach(connection => {
      connection.unsubscribe(this.stateMessage);
      connection.unsubscribe(this.standardMessage);
    });
    this.topicConnections = [];
    this.rosConnection = undefined;
  }
}