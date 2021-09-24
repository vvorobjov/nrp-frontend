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
    this.state = {
      topicConnections : []
    };
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DataVisualizerROSAdapter(SINGLETON_ENFORCER);
    }

    return this.instance;
  }

  getOrCreateConnection() {
    return;
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
        let topicType = this.state.topics[topicName];
        if (topicType === '_time') {
          continue;
        }
        if (topicType === 'gazebo_msgs/ModelStates') {
          topicName = '/gazebo/model_states';
        }
        if (!(topicName in topicSubscribed))  {
          let topicSubscriber = this.state.roslib.createTopic(
            this.state.rosConnection,
            topicName,
            topicType,
            topicType === 'gazebo_msgs/ModelStates'
              ? {
                throttleRate: 1.0 / this.state.modelPointsFrequency * 1000.0
              }
              : undefined
          );
          topicSubscribed[topicName] = true;
          if (topicType === 'gazebo_msgs/ModelStates') {
            topicSubscriber.subscribe(this.state.parseStateMessages);
          }
          else {
            topicSubscriber.subscribe(this.state.parseStandardMessages);
          }
          this.setState({ topicConnections: [...this.state.topicConnection, topicSubscriber]});
        }
      }
    }
  }

  unsubscribeTopics() {
    this.state.topicConnections.forEach(connection => {
      connection.unsubscribe(this.state.parseStateMessages);
      connection.unsubscribe(this.state.parseStandardMessages);
    });
    this.setState({ topicConnections: [], rosConnection: undefined});
  }
}