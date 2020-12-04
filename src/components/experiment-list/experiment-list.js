import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '../user-menu/user-menu.js';
import ExperimentsService from '../../services/proxy/experiments-service.js';

import ExperimentListElement from './experiment-list-element.js';

import './experiment-list.css';

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
      const experiments = await ExperimentsService.instance.getExperiments();
      this.setState({
        experiments: experiments,
      });
    } catch (error) {
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
            NEUROROBOTICS <br /> PLATFORM
          </h1>
        </div>
        <div className='experiment-page-experiments'>
          <ol>
            {this.state.experiments.map(experiment => 
              {return (
                <li key={experiment.id} class='nostyle'>
                  <ExperimentListElement experiment={experiment} pageState={this.state.pageState} />
                </li>
              );}
            )}
          </ol>
        </div>
      </div>
    );
  }
}
