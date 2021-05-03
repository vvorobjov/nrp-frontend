import React from 'react';

import { HashRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page';
import ErrorDialog from './components/dialog/error-dialog.js';
import ExperimentOverview from './components/experiment-overview/experiment-overview';
import SimulationView from './components/simulation-view/simulation-view';

class App extends React.Component {
  render() {
    return (
      <div>
        <ErrorDialog />
        <HashRouter>
          <Switch>
            <Route path='/experiments-overview'  component={ExperimentOverview} />
            <Route path='/simulation-view/:simID' component={SimulationView} />
            <Route path='/' component={EntryPage} />
          </Switch>
        </HashRouter>
      </div>
    );
  }
}

export default App;
