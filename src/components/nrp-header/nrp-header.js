/**
 * @copyright Copyright © 2023 Human Brain Project. All Rights Reserved.
 * @url       https://neurorobotics.net/
 * @file      This files defines the EventProxyService class.
 * @author    Viktor Vorobev <vorobev@in.tum.de>
 * @author    Sandro Weber
 * @since     1.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '../user-menu/user-menu.js';

import EventProxyService from '../../services/proxy/event-proxy-service';

import './nrp-header.css';

/**
 * The component drawing the top header, depending on the proxy connectivity.
 *
 * @augments React.Component
 * @listens EventProxyService.EVENTS.CONNECTED
 * @listens EventProxyService.EVENTS.DISCONNECTED
 */
export default class NrpHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      proxyConnected: EventProxyService.instance.isConnected()
    };
  }

  componentDidMount() {
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    // add listener to the beginning, because EventProxyService listener throws and prevents other listeners to execute
    EventProxyService.instance.prependListener(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
    // MqttClientService.instance.connect(this.mqttBrokerUrl);
  }

  componentWillUnmount() {
    EventProxyService.instance.off(EventProxyService.EVENTS.CONNECTED, this.onProxyConnected);
    EventProxyService.instance.off(EventProxyService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  /**
   * Changes the state when proxy is connected.
   *
   * @listens EventProxyService.EVENTS.CONNECTED
   */
  onProxyConnected = () => {
    this.setState({ proxyConnected: true});
  }

  /**
   * Changes the state when proxy is disconnected.
   *
   * @listens EventProxyService.EVENTS.CONNECTED
   */
  onProxyDisconnected = () => {
    this.setState({ proxyConnected: false});
  }

  render() {
    return (
      <div className='header-wrapper'>
        <header className='header-navigation'>
          <div>
            <Link to='/' className='header-link'>HOME</Link>
          </div>
          <div>
            {this.state.proxyConnected ?
              <Link to='/experiments-overview' className='header-link'>
                EXPERIMENTS
              </Link>
              :
              // Disabled while the proxy is offline: render an inert span (no
              // route, out of tab order, not activatable) that keeps the look.
              <span className='header-link-disabled' aria-disabled='true' tabIndex={-1}>
                EXPERIMENTS
              </span>
            }
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
