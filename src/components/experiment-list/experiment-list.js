import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '../user-menu/user-menu.js';
import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';

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
        <header className='experiment-page-header'>
          <div>
            <Link to='/'>HOME</Link>
          </div>
          <div>
            <Link to='/experiments-overview'>EXPERIMENTS</Link>
          </div>
          <a
            href='https://neurorobotics.net/'
            target='_blank'
            rel='noreferrer'
            className='header-link'
          >
            NEUROROBOTICS.AI
          </a>
          <UserMenu />
        </header>

        <div className='experiment-page-banner'>
          <h1>
            Experiment <br /> Overview
          </h1>
        </div>
        <div className='experiment-page-experiments'>
          <ol>
            {this.state.experiments.map(experiment => {
              return (
                <li key={experiment.id} className='nostyle'>
                  <ExperimentListElement experiment={experiment} pageState={this.state.pageState} />
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
