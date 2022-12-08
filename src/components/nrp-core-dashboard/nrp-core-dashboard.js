import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';
import NrpUserService from '../../services/proxy/nrp-user-service.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

import DashboardIcon from '@material-ui/icons/Dashboard';

import Grid from '@material-ui/core/Grid';
import { Alert, AlertTitle } from '@material-ui/lab';
import Button from '@material-ui/core/Button';

export default class NrpCoreDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mqttConnected: MqttClientService.instance.isConnected(),
      proxyConnected: NrpUserService.instance.userIsSet(),
      reconnectDisabled: NrpUserService.instance.userIsSet()
    };

    // this.mqttBrokerUrl = 'ws://' + window.location.hostname + ':8883';
    this.mqttBrokerUrl = MqttClientService.instance.getBrokerURL();
  }

  componentDidMount() {
    MqttClientService.instance.on(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.on(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
    // MqttClientService.instance.connect(this.mqttBrokerUrl);
  }

  componentWillUnmount() {
    MqttClientService.instance.off(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.off(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  onMqttClientConnected = () => {
    this.setState({ mqttConnected: true});
  }

  onMqttClientDisconnected = () => {
    this.setState({ mqttConnected: false});
  }

  onProxyConnected = () => {
    this.setState({ proxyConnected: true, reconnectDisabled: true});
  }

  onProxyDisconnected = () => {
    this.setState({ proxyConnected: false, reconnectDisabled: false});
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
            <Alert severity={this.state.proxyConnected ? 'success' : 'error'}
              action={
                <Button
                  color='inherit'
                  size='small'
                  disabled={this.state.reconnectDisabled}
                  onClick={ async () => {
                    this.setState({ reconnectDisabled: true});
                    await NrpUserService.instance.getCurrentUser();
                  }}
                >
                  Try to reconnect
                </Button>
              }
            >
              <AlertTitle>NRP Proxy Connection</AlertTitle>
              {this.state.proxyConnected ? 'Connected' : 'Could not get response from the Proxy'}
            </Alert>
          </Grid>
          <Grid item xs={12}>
            <Button onClick={this.triggerProxyScanStorage} disabled={!this.state.proxyConnected}>
              Proxy Scan Storage
            </Button>
          </Grid>
          {/* <Grid item xs={12}>
            <button onClick={NrpUserService.instance.getCurrentUser()}>Try to login</button>
          </Grid> */}
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
