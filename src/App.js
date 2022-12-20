import React from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentsOverview from './components/experiments-overview/experiments-overview';
import ExperimentWorkbench from './components/experiment-workbench/experiment-workbench';
// import SimulationView from './components/simulation-view/simulation-view';
import NotificationDialog from './components/dialog/notification-dialog.js';
import MqttClientService from './services/mqtt-client-service';

class App extends React.Component {

  componentDidMount() {
    this.mqttClientService = MqttClientService.instance;
    //MqttClientService.instance.connect('ws://' + window.location.hostname + ':1884');
  }

  render() {
    return (
      <div>
        <ErrorDialog />
        <NotificationDialog/>
        <BrowserRouter>
          <Switch>
            <Route path='/experiments-overview' component={ExperimentsOverview} />
            <Route path='/experiment/:experimentID' component={ExperimentWorkbench} />
            {/* <Route path='/simulation-view/:serverIP/:simulationID' component={SimulationView} /> */}
            <Route path='/' component={EntryPage} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
