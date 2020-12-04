import React from 'react';

import ExperimentsService from './services/proxy/experiments-service.js';

import EntryPage from './components/entry-page/entry-page.js';

class App extends React.Component {
  async componentDidMount() {
    try {
      const experiments = await ExperimentsService.instance.getExperiments();
      console.log(experiments);
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  }

  render() {
    return <EntryPage />;
  }
}

export default App;
