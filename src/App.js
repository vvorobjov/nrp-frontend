import React from 'react';

import { BrowserRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentOverview from './components/experiment-overview/experiment-overview';
import SimulationView from './components/simulation-view/simulation-view';
import NotificationDialog from './components/dialog/notification-dialog.js';

class App extends React.Component {
  render() {
    return (
      <div>
        <ErrorDialog />
        <NotificationDialog/>
        <BrowserRouter>
          <Switch>
            <Route path='/experiments-overview' component={ExperimentOverview} />
            <Route path='/simulation-view/:serverIP/:simulationID' component={SimulationView} />
            <Route path='/' component={EntryPage} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
