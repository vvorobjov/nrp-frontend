import React from 'react';

import ExperimentListElement from './experiment-list-element.js';

import './experiment-list.css';

export default class ExperimentList extends React.Component {
  render() {
    return (
      <div className='experiment-list-wrapper'>
        <div className='experiment-list'>
          {this.props.experiments.length === 0 ?
            <div className='no-items-notification'>List is currently empty ...</div> :
            <ol>
              {this.props.experiments.map(experiment => {
                return (
                  <li key={experiment.id || experiment.configuration.id} className='nostyle'>
                    <ExperimentListElement experiment={experiment}
                      availableServers={this.props.availableServers}
                      startingExperiment={this.props.startingExperiment}
                      selectExperimentOverviewTab={this.props.selectExperimentOverviewTab} />
                  </li>
                );
              })}
            </ol>}
        </div>
      </div>
    );
  }
}
