import React from 'react';

import ExperimentListElement from './experiment-list-element.js';
import ImportExperimentButtons from './import-experiment-buttons.js';

import './experiment-list.css';

export default class ExperimentList extends React.Component {
  render() {
    return (
      <div className='experiment-list-wrapper'>
        <div className='experiment-list'>
          <ImportExperimentButtons />
          <ol>
            {this.props.experiments.map(experiment => {
              return (
                <li key={experiment.id} className='nostyle'>
                  <ExperimentListElement experiment={experiment}
                    availableServers={this.props.availableServers}
                    startingExperiment={this.props.startingExperiment} />
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
