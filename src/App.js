import React from 'react';

import { HashRouter, Switch, Route } from 'react-router-dom';

import EntryPage from './components/entry-page/entry-page.js';
import ExperimentList from './components/experiment-list/experiment-list.js';

class App extends React.Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          <Route path='/experiments-overview'>
            <ExperimentList />
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
