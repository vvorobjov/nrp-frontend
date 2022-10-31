import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

import DashboardIcon from '@material-ui/icons/Dashboard';

import Grid from '@material-ui/core/Grid';
import { Alert, AlertTitle } from '@material-ui/lab';

export default class NrpCoreDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mqttConnected: MqttClientService.instance.isConnected()
    };

    // this.mqttBrokerUrl = 'ws://' + window.location.hostname + ':8883';
    this.mqttBrokerUrl = MqttClientService.instance.getBrokerURL();
  }

  componentDidMount() {
    MqttClientService.instance.on(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.on(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
    // MqttClientService.instance.connect(this.mqttBrokerUrl);
  }

  componentWillUnmount() {
    MqttClientService.instance.off(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.off(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
  }

  onMqttClientConnected = (MqttClient) => {
    MqttClient.subscribe('#', (err) => {
      if (err) {
        console.error(err);
      }
    });
    this.setState({ mqttConnected: true});
  }

  onMqttClientDisconnected = () => {
    this.setState({ mqttConnected: false});
  }

  async triggerProxyScanStorage() {
    let result = await ExperimentStorageService.instance.scanStorage();
    console.info('triggerProxyScanStorage:');
    console.info(result);
  }

  render() {
    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Alert severity={this.state.mqttConnected ? 'success' : 'error'}>
              <AlertTitle>MQTT Broker Connection</AlertTitle>
              {this.mqttBrokerUrl}
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <button onClick={this.triggerProxyScanStorage}>Proxy Scan Storage</button>
          </Grid>
        </Grid>
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
