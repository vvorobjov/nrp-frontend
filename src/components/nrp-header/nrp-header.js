import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '../user-menu/user-menu.js';

import './nrp-header.css';

export default class NrpHeader extends React.Component {
  render() {
    return (
      <div className='header-wrapper'>
        <header className='header-navigation'>
          <div>
            <Link to='/' className='header-link'>HOME</Link>
          </div>
          <div>
            <Link to='/experiments-overview' className='header-link'>EXPERIMENTS</Link>
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

        <div className='header-banner'>
          <h1>
            {this.props.title1}
            <br />
            {this.props.title2}
          </h1>
        </div>
      </div>
    );
  }
}
