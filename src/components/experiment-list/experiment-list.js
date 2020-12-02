import React from "react";
import experimentsService from "../../services/proxy/experiments.js";

import ExperimentListElement from "./experiment-list-element.js";

import "./experiment-list.css";

export default class ExperimentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      experiments: [],
      pageState: {},
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
    return (
      <div className="experiment-list">
        <ol>
          {this.state.experiments.map(experiment => 
            {return (
              <li key={experiment.id} class="nostyle">
                <ExperimentListElement experiment={experiment} pageState={this.state.pageState} />
              </li>
            );}
          )}
        </ol>
      </div>
    );
  }
}
