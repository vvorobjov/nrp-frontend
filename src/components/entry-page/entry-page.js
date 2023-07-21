import React from 'react';

import { instanceOf } from 'prop-types';
import { Cookies } from 'react-cookie';
import { Link } from 'react-router-dom';

import NrpHeader from '../nrp-header/nrp-header.js';

import './entry-page.css';
import NrpCoreDashboard from '../nrp-core-dashboard/nrp-core-dashboard.js';
import ExperimentListElement from '../experiment-list/experiment-list-element.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';

export default class EntryPage extends React.Component {

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      experimentIDs: [],
      experimentInfos: []
    };
  }

  async componentDidMount() {
    this.onUpdateStorageExperiments = this.onUpdateStorageExperiments.bind(this);
    ExperimentStorageService.instance.addListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
    );
  }

  onUpdateStorageExperiments(storageExperiments) {
    this.getLastExperiments(storageExperiments);
  }

  getLastExperiments(storageExperiments){
    var experimentIDs = undefined;
    // get IDs from cookie
    experimentIDs = this.props.cookies.get('experimentIDs');
    if (experimentIDs){
      this.setState({experimentIDs: experimentIDs});
    }
    var experimentInfos = [];
    var experimentInfo = undefined;
    // get experiement infos if ID in storageExperiments
    this.state.experimentIDs.forEach((expID) =>{
      experimentInfo = storageExperiments.find(experiment => experiment.id === expID);
      if (experimentInfo){
        experimentInfos = [...experimentInfos, experimentInfo];
      }
    });
    this.setState({experimentInfos: experimentInfos});
  }


  render() {
    return (
      <div className='entry-page-wrapper'>
        <div className='entry-page-header'>
          <NrpHeader title1='NEUROROBOTICS' title2='PLATFORM' />
        </div >
        <div className='dashboard'>
          <NrpCoreDashboard />
        </div >
        <div className='experiments'>
          <h4>Last Experiments:</h4>
          {(this.state.experimentInfos.length > 0) ?
            <ol>
              {this.state.experimentInfos.map(experiment => {
                return (
                  <li key={experiment.id || experiment.configuration.id} className='no-style'>
                    <ExperimentListElement experiment={experiment}
                      availableServers={experiment.joinableServers} />
                  </li>
                );
              })}
            </ol>
            :
            <Link to='/experiments-overview'
              className='first-experiment-link'>
              Start your first experiment!
            </Link>
          }
        </div>
        <iframe title='nrp-news' className='news' src='https://neurorobotics.net/latest.html' />
      </div>
    );
  }
}
