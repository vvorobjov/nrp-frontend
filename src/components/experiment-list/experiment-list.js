import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

import ExperimentListElement from './experiment-list-element.js';

import './experiment-list.css';

export default class ExperimentList extends React.Component {
  render() {
    // Distinguish "still loading the first fetch" from "loaded, but empty".
    // Showing the empty-list message before the initial request completes is
    // misleading, so render a spinner until the fetch has returned.
    let emptyContent;
    if (this.props.isLoading) {
      emptyContent = (
        <div className='no-items-notification'>
          <Spinner animation='border' role='status' size='sm' /> Loading experiments ...
        </div>
      );
    }
    else {
      emptyContent = (
        <div className='no-items-notification'>List is currently empty ...</div>
      );
    }

    return (
      <div className='experiment-list-wrapper'>
        {this.props.experiments.length === 0 ?
          emptyContent :
          <ol>
            {this.props.experiments.map(experiment => {
              return (
                <li key={experiment.id || experiment.configuration.id} className='no-style'>
                  <ExperimentListElement experiment={experiment}
                    availableServers={this.props.availableServers}
                    startingExperiment={this.props.startingExperiment}
                    selectExperimentOverviewTab={this.props.selectExperimentOverviewTab}
                    templateTab={this.props.templateTab} />
                </li>
              );
            })}
          </ol>}
      </div>
    );
  }
}
