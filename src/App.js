import React from 'react';

import experimentsService from './services/proxy/experiments.js';

import EntryPage from "./components/entry-page/entry-page.js";

class App extends React.Component {
  async componentDidMount() {
    // replace the token here with a token found in your database in ~/.opt/nrpStorage/FS_db/users for testing
    try {
      const experiments = await experimentsService.getExperiments('42bbb566-01a0-41f0-938e-c15c5722fab7');
      console.log(experiments);
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  };

  render() {return <EntryPage />;}
}

export default App;
