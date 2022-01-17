import * as THREE from 'three';

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
    this.subscribedTopics = [];
    this.topics = {};
    this.rosConnection = undefined;
    this.modelPointsFrequency = 2;
    this.sortedTopics = [];
    this.loadSettingsWhenTopic = true;
    this.modelStateLastTime = undefined;
    this.modelStateUpdateRate = DataVisualizerROSAdapter.CONSTANTS.TOPIC_MODEL_STATES_UPDATE_RATE_DEFAULT;

    console.info('DataVisualizerROSAdapter constructor done');
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerROSAdapter(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  async getTopics(serverURL, simulationID) {
    this.settings = UserSettingsService.instance.settingsData;
    await this.updateTopics(await SimulationService.instance.getTopics(serverURL),
      serverURL, simulationID);
  }

  async updateTopics(response, serverURL, simulationID) {
    this.topics = {};
    this.topics[DataVisualizerService.CONSTANTS.PLOT_DIMENSION_NAME_TIME] =
      DataVisualizerROSAdapter.CONSTANTS.PSEUDO_TOPIC_TYPE_TIME;
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
        this.topics['/' + robot.robotId + '/model_state/position.x'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
        this.topics['/' + robot.robotId + '/model_state/position.y'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
        this.topics['/' + robot.robotId + '/model_state/position.z'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
        this.topics['/' + robot.robotId + '/model_state/angle.x'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
        this.topics['/' + robot.robotId + '/model_state/angle.y'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
        this.topics['/' + robot.robotId + '/model_state/angle.z'] =
          DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES;
      }
    }
  }

  getConnection(serverConfig) {
    this.rosConnection = RoslibService.instance.getConnection(serverConfig.rosbridge.websocket);
  }

  sendStandardMessage(message) {
    DataVisualizerService.instance.sendStandardMessage(message, this.topics);
  }

  sendStateMessage(message) {
    DataVisualizerService.instance.sendStateMessage(message, this.topics);
  }

  subscribeTopics(plotStructure) {
    console.info('DV ROS - subscribeTopics');
    console.info('plotStructure');
    console.info(plotStructure);
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
        if (topicType === DataVisualizerROSAdapter.CONSTANTS.PSEUDO_TOPIC_TYPE_TIME) {
          continue;
        }
        if (topicType === DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES) {
          topicName = '/gazebo/model_states';
        }
        if (!(topicName in topicSubscribed))  {
          let rosTopic = RoslibService.instance.createTopic(
            this.rosConnection,
            topicName,
            topicType,
            topicType === DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES
              ? {
                throttleRate: 1.0 / this.modelPointsFrequency * 1000.0
              }
              : undefined
          );
          topicSubscribed[topicName] = true;
          if (topicType === DataVisualizerROSAdapter.CONSTANTS.TOPIC_TYPE_GAZEBO_MODEL_STATES) {
            rosTopic.subscribe(message => {
              //TODO: debug
              if (!this.firstStandardMessageParsed) {
                this.firstStandardMessageParsed = true;

                console.info('subscribeTopics GAZEBO_TOPIC_TYPE_MODEL_STATES');
                console.info('message');
                console.info(message);
              }

              let currentTime = Date.now() / 1000.0;
              if (this.modelStateLastTime !== undefined &&
                currentTime - this.modelStateLastTime < this.modelStateUpdateRate) {
                return;
              }
              this.modelStateLastTime = currentTime;

              let translatedMessages = this.translateGazeboModelStatesMsg(message);
              for (let message of translatedMessages) {
                this.sendStandardMessage(message);
                //this.sendStateMessage(message);
              }
              //this.sendStateMessage(translated);
            });
          }
          else {
            rosTopic.subscribe(message => {
              this.sendStandardMessage(message);
            });
          }
          this.subscribedTopics.push(rosTopic);
        }
      }
    }
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

  translateGazeboModelStatesMsg(message) {
    let translatedMessages = [];
    for (let modelIndex = 0; modelIndex < message.name.length; modelIndex++) {
      for (let topic of Object.keys(this.topics)) {
        if (topic.startsWith('/' + message.name[modelIndex] + '/model_state')) {
          let addData = false;
          let data = 0;

          if (topic.startsWith('/' + message.name[modelIndex] + '/model_state/position')) {
            addData = true;
            if (topic.endsWith('.x')) {
              data = message.pose[modelIndex].position.x;
            }
            else if (topic.endsWith('.y')) {
              data = message.pose[modelIndex].position.y;
            }
            else if (topic.endsWith('.z')) {
              data = message.pose[modelIndex].position.z;
            }
          }
          else if (topic.startsWith('/' + message.name[modelIndex] + '/model_state/angle')) {
            addData = true;
            let q = new THREE.Quaternion(
              message.pose[modelIndex].orientation.x,
              message.pose[modelIndex].orientation.y,
              message.pose[modelIndex].orientation.z,
              message.pose[modelIndex].orientation.w
            );
            let euler = new THREE.Euler();
            euler.setFromQuaternion(q, 'XYZ');
            if (topic.endsWith('.x')) {
              data = euler.x;
            }
            else if (topic.endsWith('.y')) {
              data = euler.y;
            }
            else if (topic.endsWith('.z')) {
              data = euler.z;
            }
          }

          if (addData) {
            /*translatedMessages.push({
              //TODO: this seems very unnecessary, is this how standard messages from ROS are also structured?
              message: {
                name: topic,
                data: data
              }
            });*/
            translatedMessages.push({
              name: topic,
              data: data
            });
          }
        }
      }
    }

    if (!this.firstModelStateMessageTranslated) {
      console.info('translateGazeboModelStatesMsg');
      console.info('message');
      console.info(message);
      console.info('this.topics');
      console.info(this.topics);
      console.info('translatedMessages');
      console.info(translatedMessages);

      this.firstModelStateMessageTranslated = true;
    }

    return translatedMessages;
  }
}

DataVisualizerROSAdapter.CONSTANTS = Object.freeze({
  TOPIC_TYPE_GAZEBO_MODEL_STATES: 'gazebo_msgs/ModelStates',
  PSEUDO_TOPIC_TYPE_TIME: '_time',
  TOPIC_MODEL_STATES_UPDATE_RATE_DEFAULT: 0.1
});