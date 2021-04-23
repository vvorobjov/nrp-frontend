import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
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
        <Dropdown>
          <Dropdown.Toggle
            className='dropdown-toggle'
            variant='success'
            id='dropdown-basic'
          >
            <FaUserCircle className='user-icon' />
            <div className='user-name'>
              {this.state.user ? this.state.user.displayName : 'pending ...'}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className='dropdown-menu'>
            <Dropdown.Item
              className='dropdown-item'
              onClick={this.onClickLogout}
            >
              <FaSignOutAlt className='user-icon' />
               Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

      </div>
    );
  }
}
