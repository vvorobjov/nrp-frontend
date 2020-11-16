import React from 'react';

import experimentsService from './services/proxy/experiments.js';

import EntryPage from "./components/entry-page/entry-page.js";
import ExperimentContainer from './components/experiment-list/experiment-list.js';

class App extends React.Component {
  async componentDidMount() {
    // replace the token here with a token found in your database in ~/.opt/nrpStorage/FS_db/users for testing
    try {
      const experiments = await experimentsService.getExperiments('27f3988c-ccfe-4519-921c-b804a966d708');
      console.log(experiments);
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  };

  render() {
    return (
      <React.Fragment>
        <EntryPage />
        <ExperimentContainer />
      </React.Fragment>
    );
  }
}

export default App;
