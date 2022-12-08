import React from 'react';

import NrpUserService from '../../services/proxy/nrp-user-service.js';
import AuthenticationService from '../../services/authentication-service.js';

import Dropdown from 'react-bootstrap/Dropdown';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

import './user-menu.css';

export default class UserMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null
    };
  }

  /**
   * is invoked immediately after a component is mounted (inserted into the tree).
   * Initialization that requires DOM nodes should go here.
   * If you need to load data from a remote endpoint,
   * this is a good place to instantiate the network request.
   */
  async componentDidMount() {
    this.getCurrentUser();
    NrpUserService.instance.on(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * is invoked immediately before a component is unmounted and destroyed.
   * Perform any necessary cleanup in this method,
   * such as invalidating timers, canceling network requests,
   * or cleaning up any subscriptions that were created in componentDidMount().
   */
  componentWillUnmount() {
    this.cancelGetCurrentUser = true;
    NrpUserService.instance.off(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * Updates the user information when the Proxy connection trigger is emitted
   */
  onProxyConnected = () => {
    this.getCurrentUser();
  }

  /**
   * Cleans the user information when the Proxy connection problem trigger is emitted
   */
  onProxyDisconnected = () => {
    this.setState({ user: null });
  }

  /**
   * Gets the user information through the NrpUserService
   */
  async getCurrentUser() {
    NrpUserService.instance.getCurrentUser().then((currentUser) => {
      if (!this.cancelGetCurrentUser) {
        this.setState({
          user: currentUser
        });
      }
    });
  }

  /**
   * Invokes the logout procedure
   */
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
            <div id='user-menu-name' className='user-name'>
              <AccountCircleIcon className='user-icon' />
              {this.state.user ? this.state.user.displayName : 'pending ...'}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className='dropdown-menu'>
            <Dropdown.Item
              className='dropdown-item'
              onClick={this.onClickLogout}
            >
              <ExitToAppIcon className='user-icon' />
               Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
}
