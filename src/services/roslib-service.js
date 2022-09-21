import * as ROSLIB from 'roslib';
import _ from 'lodash';

import AuthenticationService from './authentication-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class RoslibService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.connections = new Map();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new RoslibService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Create a new connection or return an existing one to a ROS websocket.
   * @param {string} url - URL of the ROS websocket to connect to
   */
  getConnection(url) {
    if (!this.connections.has(url)) {
      let urlWithAuth = url + '?token=' + AuthenticationService.instance.getToken();
      this.connections.set(url, new ROSLIB.Ros({ url: urlWithAuth, encoding: 'ascii' }));
    }

    return this.connections.get(url);
  };

  /**
   * Create a new ROSLIB.Topic.
   * @param {object} connection - the ROSLIB.Ros connection
   * @param {*} topicName - name of the topic
   * @param {*} messageType - message type
   * @param {*} additionalOptions - additional options to extend the ROSLIB.Topic with
   */
  createTopic(connection, topicName, messageType, additionalOptions) {
    return new ROSLIB.Topic(
      _.extend(
        {
          ros: connection,
          name: topicName,
          messageType: messageType
        },
        additionalOptions
      )
    );
  };

  createStringTopic(connection, topicName) {
    return this.createTopic(connection, topicName, 'std_msgs/String');
  };

  createService(connection, serviceName, additionalOptions) {
    return new ROSLIB.Service(
      _.extend(
        {
          ros: connection,
          name: serviceName,
          serviceType: serviceName
        },
        additionalOptions
      )
    );
  };
}

export default RoslibService;
