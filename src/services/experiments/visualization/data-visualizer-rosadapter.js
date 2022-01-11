import SimulationService from '../execution/running-simulation-service';
import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerService from './data-visualizer-service';
import RoslibService from '../../roslib-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * ROS adapter taking care of communication between gazebo and the data visualizer
 * It establishes, maintaines and closes ROS connections to topics with parameters:
 * - supported types: data (Float and Int)
 * - model points frequency: update rate (2)
 */
export default class DataVisualizerROSAdapter {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this.supportedTypes =  [
      'std_msgs/Float32',
      'std_msgs/Float64',
      'std_msgs/Int32',
      'std_msgs/Int64',
      'std_msgs/UInt32',
      'std_msgs/UInt64'
    ];
    this.topicConnections = [];
    this.topics = [];
    this.rosConnection = undefined;
    this.modelPointsFrequency = 2;
    this.sortedTopics = [];
    this.loadSettingsWhenTopic = true;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerROSAdapter(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async getTopics(serverURL, simulationID) {
    this.settings = UserSettingsService.instance.settingsData;
    await this.sendTopics(await SimulationService.instance.getTopics(serverURL),
      serverURL, simulationID);
  }

  async sendTopics(response, serverURL, simulationID) {
    this.topics = { Time: '_time' };
    for (let i = 0; i < response.topics.length; i++) {
      if (this.supportedTypes.includes(response.topics[i].topicType)) {
        this.topics[response.topics[i].topic] = response.topics[i].topicType;
      }
    }
    await this.loadRobotTopics(serverURL, simulationID);
    this.sortedTopics = Object.keys(this.topics);
    this.sortedTopics.sort();
    DataVisualizerService.instance.sendSortedSources(this.sortedTopics);
    if (this.loadSettingsWhenTopic) {
      this.loadSettingsWhenTopic = false;
      DataVisualizerService.instance.sendSettings(this.settings);
    }
  }

  async loadRobotTopics(serverURL, simulationID) {
    let response = await SimulationService.instance.getRobots(serverURL, simulationID);
    if (response.robots) {
      for (let i = 0; i < response.robots.length; i++) {
        const robot = response.robots[i];
        this.topics['/' + robot.robotId + '/model_state/position.x'] = 'gazebo_msgs/ModelStates';
        this.topics['/' + robot.robotId + '/model_state/position.y'] = 'gazebo_msgs/ModelStates';
        this.topics['/' + robot.robotId + '/model_state/position.z'] = 'gazebo_msgs/ModelStates';
        this.topics['/' + robot.robotId + '/model_state/angle.x'] = 'gazebo_msgs/ModelStates';
        this.topics['/' + robot.robotId + '/model_state/angle.y'] = 'gazebo_msgs/ModelStates';
        this.topics['/' + robot.robotId + '/model_state/angle.z'] = 'gazebo_msgs/ModelStates';
      }
    }
  }

  getConnection(serverConfig) {
    this.rosConnection = RoslibService.instance.getConnection(serverConfig.rosbridge.websocket);
  }

  sendStandardMessage(message) {
    DataVisualizerService.instance.sendStandardMessage(message, this.topics);
  }

  sendStateMessage (message) {
    DataVisualizerService.instance.sendStateMessage(message, this.topics);
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
          let topicSubscriber = RoslibService.instance.createTopic(
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
            topicSubscriber.subscribe(message => {
              this.sendStandardMessage(message);
            });
          }
          else {
            topicSubscriber.subscribe(message => {
              this.sendStateMessage(message);
            });
          }
          this.topicConnections = [...this.topicConnections, topicSubscriber];
        }
      }
    }
  }

  unsubscribeTopics() {
    this.topicConnections.forEach(connection => {
      connection.unsubscribe(message => {
        this.sendStandardMessage(message);
      });
      connection.unsubscribe(message => {
        this.sendStateMessage(message);
      });
    });
    this.topicConnections = [];
    this.rosConnection = undefined;
  }
}