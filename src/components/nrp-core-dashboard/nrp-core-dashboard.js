import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';

export default class NrpCoreDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.mqttBrokerUrl = 'ws://' + window.location.hostname + ':1884';
  }

  componentDidMount() {
    MqttClientService.instance.on(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.connect(this.mqttBrokerUrl);
  }

  onMqttClientConnected(MqttClient) {
    MqttClient.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
    // As a test to make sure MqttClientService can subscribe to multiple topics (and the same topic) at once
    let token1 = MqttClientService.instance.subscribeToTopic('test_topic', (param1) => (console.info(param1)));
    let token2 = MqttClientService.instance.subscribeToTopic('test_topic', (param1) => (console.info(param1)));
    let token3 = MqttClientService.instance.subscribeToTopic('test_topic', (param1) => (console.info(param1)));
    let token4 = MqttClientService.instance.subscribeToTopic('test_topic_proto', (param1) => (console.info(param1)));
    //TODO: test unsubscribe once implemented
  }

  render() {
    return (
      <div>
        {this.mqttBrokerUrl}
      </div>
    );
  }
}

NrpCoreDashboard.CONSTANTS = Object.freeze({
  TOOL_CONFIG: {
    singleton: true,
    flexlayoutNode: {
      'type': 'tab',
      'name': 'NRP-Core Dashboard',
      'component': 'nrp-core-dashboard'
    },
    flexlayoutFactoryCb: () =>  {
      return <NrpCoreDashboard />;
    },
    getIcon: () => {
      return <div>
        <span>NRP-Core Dashboard</span>
      </div>;
    }
  }
});
