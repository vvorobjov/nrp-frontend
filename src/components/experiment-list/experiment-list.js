import React from 'react';

import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';
import ExperimentServerService from '../../services/experiments/execution/experiment-server-service.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';

import ExperimentListElement from './experiment-list-element.js';

import './experiment-list.css';

export default class ExperimentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      experiments: [],
      availableServers: [],
      startingExperiment: undefined,
      pageState: {}
    };
  }

  async componentDidMount() {
    try {
      const experiments = await ExperimentStorageService.instance.getExperiments();
      this.setState({
        experiments: experiments
      });
    }
    catch (error) {
      console.error(`Failed to fetch the list of experiments. Error: ${error}`);
    }

    this.onUpdateServerAvailability = this.onUpdateServerAvailability.bind(this);
    ExperimentServerService.instance.addListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    this.onStartExperiment = this.onStartExperiment.bind(this);
    ExperimentExecutionService.instance.addListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );
  }

  componentWillUnmount() {
    ExperimentServerService.instance.removeListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    ExperimentExecutionService.instance.removeListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );
  }

  onUpdateServerAvailability(availableServers) {
    this.setState({availableServers: availableServers});
  };

  onStartExperiment(experiment) {
    this.setState({startingExperiment: experiment});
  };

  render() {
    return (
      <div className='experiment-list-wrapper'>
        <div className='experiment-list'>
          <ol>
            {this.state.experiments.map(experiment => {
              return (
                <li key={experiment.id} className='nostyle'>
                  <ExperimentListElement experiment={experiment}
                    availableServers={this.state.availableServers}
                    startingExperiment={this.state.startingExperiment}
                    pageState={this.state.pageState} />
                </li>
              );
            }
            )}
          </ol>
        </div>
      </div>
    );
  }
}
