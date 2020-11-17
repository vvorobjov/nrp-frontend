import React from "react";
import experimentsService from "../../services/proxy/experiments.js";

import ExperimentListElement from "./experiment-list-element.js";

export default class ExperimentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      experiments: [],
    };
  }

  async componentDidMount() {
    // replace the token here with a token found in your database in ~/.opt/nrpStorage/FS_db/users for testing
    try {
      const experiments = await experimentsService.getExperiments();
      this.setState({
        experiments: experiments,
      });
    } catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }
  }

  render() {
    /*if (this.state.experiments) {
      return this.state.experiments.then((file) => {
        file.forEach((experiment) => {
          this.renderExperiment(experiment);
        });
      });
    } else {
      return null;
    }*/
    return <ExperimentListElement experiment={this.state.experiments[0]} />;
  }
}

/*export default class ExperimentContainer extends React.Component {
  render() {
    return (
      <div className="experiment-container">
        <div className="experiment-list">
          <ol>
            <ExperimentList />
          </ol>
        </div>
      </div>
    );
  }
}*/
