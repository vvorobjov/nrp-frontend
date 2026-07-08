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
   * @returns {Promise<object>} the ROSLIB.Ros connection
   */
  async getConnection(url) {
    const token = await AuthenticationService.instance.getToken();
    const cached = this.connections.get(url);
    // The cache is keyed by the clean URL, never by the token-bearing URL, so a
    // refreshed token does not leak a second cached connection. When the token
    // changes we recreate the connection so the new token reaches the ROS
    // websocket (which bakes the token into its connection URL and would
    // otherwise keep reconnecting with a stale/expired token).
    if (!cached || cached.token !== token) {
      if (cached && cached.ros && typeof cached.ros.close === 'function') {
        cached.ros.close();
      }
      let urlWithAuth = url + '?token=' + token;
      this.connections.set(url, { ros: new ROSLIB.Ros({ url: urlWithAuth }), token });
    }

    return this.connections.get(url).ros;
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
