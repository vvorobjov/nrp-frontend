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
    NrpUserService.instance.on(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  componentWillUnmount() {
    this.cancelGetCurrentUser = true;
    NrpUserService.instance.off(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  onProxyConnected = () => {
    NrpUserService.instance.getCurrentUser().then((currentUser) => {
      if (!this.cancelGetCurrentUser) {
        this.setState({
          user: currentUser
        });
      }
    });
  }

  onProxyDisconnected = () => {
    this.setState({ user: null });
  }

  onClickLogout() {
    AuthenticationService.instance.logout();
    window.location.reload(true);
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
            <div className='user-name'>
              <FaUserCircle className='user-icon' />
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
