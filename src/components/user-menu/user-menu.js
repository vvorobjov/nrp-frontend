import React from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

import NrpUserService from '../../services/proxy/nrp-user-service.js';
import AuthenticationService from '../../services/authentication-service.js';

import './user-menu.css';

export default class UserMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null
    };
  }

  async componentDidMount() {
    NrpUserService.instance.getCurrentUser().then((currentUser) => {
      if (!this.cancelGetCurrentUser) {
        this.setState({
          user: currentUser
        });
      }
    });
  }

  componentWillUnmount() {
    this.cancelGetCurrentUser = true;
  }

  onClickLogout() {
    AuthenticationService.instance.clearStoredToken();
    window.location.reload();
  }

  render() {
    return (
      <div className='user-menu-wrapper'>
        <div className='dropdown'>
          <button className='dropdown-toggle' id='dropdownMenuButton'
            data-toggle="dropdown" aria-haspopup='true' aria-expanded='false'>
            <FaUserCircle className='user-icon'/>
            <div className='user-name'>
              {this.state.user ? this.state.user.displayName : 'pending ...'}
            </div>
          </button>

          <div className='dropdown-menu' aria-labelledby='dropdownMenuButton'>
            <div className='dropdown-item' href='#' onClick={this.onClickLogout}>
              <FaSignOutAlt className='user-icon' />
              Logout
            </div>
          </div>
        </div>
      </div>
    );
  }
}
