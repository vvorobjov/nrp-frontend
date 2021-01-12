import React from 'react';

import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';

import NrpHeader from '../nrp-header/nrp-header.js';
import ExperimentListElement from './experiment-list-element.js';

import './experiment-list.css';

export default class ExperimentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      experiments: [],
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
  }

  render() {
    return (
      <div className='experiment-page'>
        <div className='experiment-list-header'>
          <NrpHeader title1='EXPERIMENT' title2='OVERVIEW' />
        </div>

        <div className='experiment-page-experiments'>
          <ol>
            {this.state.experiments.map(experiment => {
              return (
                <li key={experiment.id} className='nostyle'>
                  <ExperimentListElement experiment={experiment}
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
