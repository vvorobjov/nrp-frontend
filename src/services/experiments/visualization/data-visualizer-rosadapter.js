import SimulationService from '../execution/running-simulation-service';
import UserSettingsService from '../../user/user-settings-service';
import DataVisualizerService from './data-visualizer-service';
import DialogService from '../../dialog-service';
import ServerResourcesService from '../execution/server-resources-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * ROS adapter taking care of communication between gazebo and the data visualizer
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
    this.sceneInfo = [];
    this.roslib = undefined;
    this.rosConnection = undefined;
    this.modelPointsFrequency = 2;
    this.topics = [];
    this.sortedTopics = [];
    this.loadSettingsWhenTopic = true;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerROSAdapter(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async getTopics(serverURL) {
    this.settings = UserSettingsService.instance.settingsData;
    this.sendTopics(await SimulationService.instance.getTopics(serverURL));
  }

  sendTopics(response) {
    this.topics = [{ Time: '_time' }];
    for (let i = 0; i < response.topics.length; i++) {
      if (this.supportedTypes.includes(response.topics[i].topicType)) {
        this.topics[response.topics[i].topic] = response.topics[i].topicType;
      }
    }
    this.sortedTopics = Object.keys(this.topics);
    this.sortedTopics.sort();
    this.loadRobotTopics();
    DataVisualizerService.instance.sendSortedSources(this.sortedTopics);
    if (this.loadSettingsWhenTopic) {
      this.loadSettingsWhenTopic = false;
      DataVisualizerService.instance.sendSettings(this.settings);
    }
  }

  loadRobotTopics() {
    if (this.sceneInfo.robots) {
      for (let i = 0; i < this.sceneInfo.robots.length; i++) {
        const robot = this.sceneInfo.robots[i];
        let topics = this.topics;
        topics['/' + robot.robotId + '/model_state/position.x'] = 'gazebo_msgs/ModelStates';
        topics['/' + robot.robotId + '/model_state/position.y'] = 'gazebo_msgs/ModelStates';
        topics['/' + robot.robotId + '/model_state/position.z'] = 'gazebo_msgs/ModelStates';
        topics['/' + robot.robotId + '/model_state/angle.x'] = 'gazebo_msgs/ModelStates';
        topics['/' + robot.robotId + '/model_state/angle.y'] = 'gazebo_msgs/ModelStates';
        topics['/' + robot.robotId + '/model_state/angle.z'] = 'gazebo_msgs/ModelStates';
        const request = new this.roslib.ServiceRequest({
          model_name: robot.robotId
        });
        const rosWebSocketURL = ServerResourcesService.instance.getServerConfig().rosbridge.websocket;
        const rosModelPropertyService = this.roslib.createService(
          rosWebSocketURL,
          '/gazebo/get_model_propreties',
          'GetModelProperties'
        );
        rosModelPropertyService.callService(
          request,
          robotProperties => {
            this.parseRobotModelTopics(robotProperties);
          },
          error => {
            DialogService.instance.rosError(error);
          }
        );
      }
    }
  }

  parseRobotModelTopics(robotProperties) {
    if (robotProperties.sensorNames && robotProperties.sensorNames.length > 0) {
      for (let i = 0; i < robotProperties.sensorNames.length; i++) {
        if (
          robotProperties.sensorROSMessageType && robotProperties.sensorROSMessageType[i] &&
          robotProperties.sensorNamesROS.length === robotProperties.sensorNames.length
        ) {
          let topicURL = robotProperties.rostopicSensorURLs[i];
          let rosType = robotProperties.sensorROSMessageType[i].replace('/', '.msg.');
          if (this.supportedTypes.includes(rosType)) {
            this.addTopic(topicURL, rosType);
          }
        }
      }
    }
  }

  addTopic(topicURL, rosType) {
    if (this.supportedTypes.includes(rosType)) {
      if (rosType === 'geometry_msgs.msg.Twist') {
        this.topics[topicURL + '/linear.x'] = rosType;
        this.topics[topicURL + '/linear.y'] = rosType;
        this.topics[topicURL + '/linear.z'] = rosType;
        this.topics[topicURL + '/angular.x'] = rosType;
        this.topics[topicURL + '/angular.y'] = rosType;
        this.topics[topicURL + '/angular.z'] = rosType;
      }
      else {
        this.topics[topicURL] = rosType;
      }
    }
  }

  getOrCreateConnection(server) {
    return this.roslib.getOrCreateConnection(server);
  }

  sendMessageAndTopics (message) {
    DataVisualizerService.instance.sendMessageAndTopics(message, this.topics);
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