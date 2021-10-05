import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';

import mqtt from 'mqtt';

import EntryPage from './components/entry-page/entry-page';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentOverview from './components/experiment-overview/experiment-overview';
import SimulationView from './components/simulation-view/simulation-view';
import NotificationDialog from './components/dialog/notification-dialog.js';

class App extends React.Component {

  componentDidMount() {
    console.info(window.location);
    const client = mqtt.connect('ws://' + window.location.hostname + ':9000/mqtt');
    client.on('connect', () => {
      console.info('MQTT connected');
      console.info(client);
    });
    client.on('error', (error) => {
      console.error(error);
    });
    client.on('message', (topic, payload, packet) => {
      console.info('MQTT message');
      console.info(topic);
      console.info(payload);
      console.info(packet);
    });
  }

  render() {
    return (
      <div>
        <ErrorDialog />
        <NotificationDialog/>
        <HashRouter>
          <Switch>
            <Route path='/experiments-overview' component={ExperimentOverview} />
            <Route path='/simulation-view/:serverIP/:simulationID' component={SimulationView} />
            <Route path='/' component={EntryPage} />
          </Switch>
        </HashRouter>
      </div>
    );
  }
}

export default App;
