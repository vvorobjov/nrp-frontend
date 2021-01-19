import React from 'react';

import { HashRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page.js';
import ExperimentOverview from './components/experiment-overview/experiment-overview.js';

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          <Route path='/experiments-overview'>
            <ExperimentOverview />
          </Route>
          <Route path='/'>
            <EntryPage />
          </Route>
        </Switch>
      </HashRouter>
    );
  }
}

export default App;
