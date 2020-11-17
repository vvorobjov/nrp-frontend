import React from "react";

import experimentsService from "./services/proxy/experiments.js";

import EntryPage from "./components/entry-page/entry-page.js";
import ExperimentContainer from "./components/experiment-list/experiment-list.js";

class App extends React.Component {
  async componentDidMount() {
    try {
      const experiments = await experimentsService.getExperiments();
      console.log(experiments);
    } catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  }

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
