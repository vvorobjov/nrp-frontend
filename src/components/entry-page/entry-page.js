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
      experimentInfos: [],
      // The news iframe is a cross-origin embed that can hang or fail; track
      // its load so we can show a loading state and an error/empty fallback.
      newsLoading: true,
      newsError: false,
      newsKey: 0
    };
  }

  async componentDidMount() {
    this.onUpdateStorageExperiments = this.onUpdateStorageExperiments.bind(this);
    ExperimentStorageService.instance.addListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
    );
    this.startNewsLoadTimeout();
  }

  componentWillUnmount() {
    // Remove the storage listener so the service does not call setState on an
    // unmounted component (memory leak + React warning).
    ExperimentStorageService.instance.removeListener(
      ExperimentStorageService.EVENTS.UPDATE_EXPERIMENTS,
      this.onUpdateStorageExperiments
    );
    this.clearNewsLoadTimeout();
  }

  /**
   * A cross-origin iframe that never loads fires no `onError`, so use a
   * timeout watchdog to fall back to the error state.
   */
  startNewsLoadTimeout() {
    this.clearNewsLoadTimeout();
    this.newsLoadTimeout = setTimeout(() => {
      if (this.state.newsLoading) {
        this.setState({ newsLoading: false, newsError: true });
      }
    }, EntryPage.NEWS_LOAD_TIMEOUT_MS);
  }

  clearNewsLoadTimeout() {
    if (this.newsLoadTimeout) {
      clearTimeout(this.newsLoadTimeout);
      this.newsLoadTimeout = undefined;
    }
  }

  onNewsLoad = () => {
    this.clearNewsLoadTimeout();
    this.setState({ newsLoading: false, newsError: false });
  };

  onNewsError = () => {
    this.clearNewsLoadTimeout();
    this.setState({ newsLoading: false, newsError: true });
  };

  retryNews = () => {
    this.setState(
      (state) => ({ newsLoading: true, newsError: false, newsKey: state.newsKey + 1 }),
      () => this.startNewsLoadTimeout()
    );
  };

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
        <div className='news'>
          <div className='news-frame-container'>
            {this.state.newsError ?
              <div className='news-fallback'>
                <div>Latest news could not be loaded.</div>
                <div className='news-fallback-actions'>
                  <button className='news-retry' onClick={this.retryNews}>Retry</button>
                  <a href='https://neurorobotics.net/latest.html' target='_blank' rel='noreferrer'>
                    Open neurorobotics.net
                  </a>
                </div>
              </div>
              :
              <React.Fragment>
                {this.state.newsLoading &&
                  <div className='news-loading'>Loading latest news…</div>
                }
                <iframe key={this.state.newsKey} title='nrp-news' className='news-frame'
                  src='https://neurorobotics.net/latest.html'
                  onLoad={this.onNewsLoad}
                  onError={this.onNewsError} />
              </React.Fragment>
            }
          </div>
        </div>
      </div>
    );
  }
}

// How long to wait for the news iframe to load before showing the fallback.
EntryPage.NEWS_LOAD_TIMEOUT_MS = 12000;
