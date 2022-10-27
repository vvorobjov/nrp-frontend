import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

import DashboardIcon from '@material-ui/icons/Dashboard';

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
  }

  async triggerProxyScanStorage() {
    let result = await ExperimentStorageService.instance.scanStorage();
    console.info('triggerProxyScanStorage:');
    console.info(result);
  }

  render() {
    return (
      <div>
        {this.mqttBrokerUrl}
        <br />
        <button onClick={this.triggerProxyScanStorage}>Proxy Scan Storage</button>
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
      return <DashboardIcon/>;
    }
  }
});
