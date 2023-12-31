import React from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { withCookies } from 'react-cookie';

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
  }

  render() {
    return (
      <div>
        <ErrorDialog />
        <NotificationDialog/>
        <BrowserRouter>
          <Switch>
            <Route path='/experiments-overview' render={() => (<ExperimentsOverview/>)} />
            <Route path='/experiment/:experimentID' component={ExperimentWorkbench}/>
            {/* <Route path='/simulation-view/:serverIP/:simulationID' component={SimulationView} /> */}
            <Route path='/' render={() => (<EntryPage cookies={this.props.cookies}/>)} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default withCookies(App);
