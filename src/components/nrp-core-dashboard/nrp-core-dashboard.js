import React from 'react';

import MqttClientService from '../../services/mqtt-client-service';
import NrpUserService from '../../services/proxy/nrp-user-service.js';
import EventProxyService from '../../services/proxy/event-proxy-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

import Grid from '@material-ui/core/Grid';
import { Alert, AlertTitle } from '@material-ui/lab';
import Button from '@material-ui/core/Button';
import DashboardIcon from '@material-ui/icons/Dashboard';

/**
 * The component drawing the NRP dashboard,
 * depending on the proxy and MQTT connectivity.
 *
 * @augments React.Component
 * @listens EventProxyService.EVENTS.CONNECTED
 * @listens EventProxyService.EVENTS.DISCONNECTED
 * @listens MqttClientService.EVENTS.CONNECTED
 * @listens MqttClientService.EVENTS.DISCONNECTED
 */
export default class NrpCoreDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mqttConnected: MqttClientService.instance.isConnected(),
      proxyConnected: EventProxyService.instance.isConnected(),
      reconnectDisabled: EventProxyService.instance.isConnected()
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
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    // add listener to the beginning, because EventProxyService listener throws and prevents other listeners to execute
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
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
    EventProxyService.instance.off(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    EventProxyService.instance.off(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * Sets the component state when the MQTT connection trigger is emitted.
   * @listens MqttClientService.EVENTS.CONNECTED
   */
  onMqttClientConnected = () => {
    this.setState({ mqttConnected: true});
  }

  /**
   * Sets the component state when the MQTT connection problem trigger is emitted
   * @listens MqttClientService.EVENTS.DISCONNECTED
   */
  onMqttClientDisconnected = () => {
    this.setState({ mqttConnected: false});
  }

  /**
   * Sets the component state when the Proxy connection trigger is emitted
   * @listens EventProxyService.EVENTS.CONNECTED
   */
  onProxyConnected = () => {
    this.setState({ proxyConnected: true, reconnectDisabled: true});
  }

  /**
   * Sets the component state when the Proxy connection problem trigger is emitted
   * @listens EventProxyService.EVENTS.DISCONNECTED
   */
  onProxyDisconnected = () => {
    this.setState({ proxyConnected: false, reconnectDisabled: false});
  }

  async triggerProxyScanStorage() {
    let result = await ExperimentStorageService.instance.scanStorage();
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
                    try {
                      await NrpUserService.instance.getCurrentUser();
                    }
                    finally {
                      this.setState({ reconnectDisabled: EventProxyService.instance.isConnected()});
                    }
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
