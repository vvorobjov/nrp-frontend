import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';
import NrpUserService from '../../services/proxy/nrp-user-service.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

import Grid from '@material-ui/core/Grid';
import { Alert, AlertTitle } from '@material-ui/lab';
import Button from '@material-ui/core/Button';
import DashboardIcon from '@material-ui/icons/Dashboard';

export default class NrpCoreDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mqttConnected: MqttClientService.instance.isConnected(),
      proxyConnected: NrpUserService.instance.userIsSet(),
      reconnectDisabled: NrpUserService.instance.userIsSet()
    };

    this.mqttBrokerUrl = MqttClientService.instance.getBrokerURL();
  }

  /**
   * is invoked immediately after a component is mounted (inserted into the tree).
   * Initialization that requires DOM nodes should go here.
   * If you need to load data from a remote endpoint,
   * this is a good place to instantiate the network request.
   */
  componentDidMount() {
    MqttClientService.instance.on(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.on(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * is invoked immediately before a component is unmounted and destroyed.
   * Perform any necessary cleanup in this method,
   * such as invalidating timers, canceling network requests,
   * or cleaning up any subscriptions that were created in componentDidMount().
   */
  componentWillUnmount() {
    MqttClientService.instance.off(MqttClientService.EVENTS.CONNECTED, this.onMqttClientConnected);
    MqttClientService.instance.off(MqttClientService.EVENTS.DISCONNECTED, this.onMqttClientDisconnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * Sets the component state when the MQTT connection trigger is emitted
   */
  onMqttClientConnected = () => {
    this.setState({ mqttConnected: true});
  }

  /**
   * Sets the component state when the MQTT connection problem trigger is emitted
   */
  onMqttClientDisconnected = () => {
    this.setState({ mqttConnected: false});
  }

  /**
   * Sets the component state when the Proxy connection trigger is emitted
   */
  onProxyConnected = () => {
    this.setState({ proxyConnected: true, reconnectDisabled: true});
  }

  /**
   * Sets the component state when the Proxy connection problem trigger is emitted
   */
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
