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

  onMqttClientConnected(mqttClient) {
    mqttClient.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
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
