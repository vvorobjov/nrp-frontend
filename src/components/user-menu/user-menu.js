import React from 'react';

import NrpUserService from '../../services/proxy/nrp-user-service.js';
import EventProxyService from '../../services/proxy/event-proxy-service';
import AuthenticationService from '../../services/authentication-service.js';

import Dropdown from 'react-bootstrap/Dropdown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import './user-menu.css';

export default class UserMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      user: null,
      loading: true,
      loadError: false
    };
  }

  /**
   * is invoked immediately after a component is mounted (inserted into the tree).
   * Initialization that requires DOM nodes should go here.
   * If you need to load data from a remote endpoint,
   * this is a good place to instantiate the network request.
   */
  async componentDidMount() {
    this.getCurrentUser(true);
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * is invoked immediately before a component is unmounted and destroyed.
   * Perform any necessary cleanup in this method,
   * such as invalidating timers, canceling network requests,
   * or cleaning up any subscriptions that were created in componentDidMount().
   */
  componentWillUnmount() {
    this.cancelGetCurrentUser = true;
    EventProxyService.instance.off(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    EventProxyService.instance.off(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
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
    this.setState({ user: null, loading: false, loadError: true });
  }

  /**
   * Gets the user information through the NrpUserService.
   * Resolves to a real user, or falls back to an error/retry state after a
   * timeout, so the menu never hangs on "pending …" forever.
   *
   * @param {boolean} force - force a refresh of the cached user
   */
  async getCurrentUser(force = false) {
    this.setState({ loading: true, loadError: false });
    try {
      const currentUser = await Promise.race([
        NrpUserService.instance.getCurrentUser(force),
        new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error('timeout')), UserMenu.CONSTANTS.USER_FETCH_TIMEOUT_MS))
      ]);
      if (this.cancelGetCurrentUser) {
        return;
      }
      if (currentUser) {
        this.setState({ user: currentUser, loading: false, loadError: false });
      }
      else {
        // Resolved without a user (request failed inside the service).
        this.setState({ user: null, loading: false, loadError: true });
      }
    }
    catch (error) {
      // Timed out or threw: surface an actionable retry instead of hanging.
      if (this.cancelGetCurrentUser) {
        return;
      }
      this.setState({ user: null, loading: false, loadError: true });
    }
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
              {this.state.user
                ? this.state.user.displayName
                : this.state.loading
                  ? 'Loading…'
                  : <button type='button' className='user-retry'
                    onClick={(event) => {
                      // Don't let the retry click toggle the dropdown open.
                      event.stopPropagation();
                      this.getCurrentUser(true);
                    }}>
                    Unavailable — retry
                  </button>
              }
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

UserMenu.CONSTANTS = Object.freeze({
  // Give up waiting for the identity request after this long and offer a retry.
  USER_FETCH_TIMEOUT_MS: 10000
});
