import React from 'react';

import { HashRouter, Switch, Route } from 'react-router-dom';

import ExperimentsService from './services/proxy/experiments-service.js';

import EntryPage from './components/entry-page/entry-page.js';
import ExperimentList from './components/experiment-list/experiment-list.js';

class App extends React.Component {
  async componentDidMount() {
    try {
      const experiments = await ExperimentsService.instance.getExperiments();
      console.log(experiments);
    } catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  }

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
