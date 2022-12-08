import React from 'react';
import { Link } from 'react-router-dom';

import UserMenu from '../user-menu/user-menu.js';

import NrpUserService from '../../services/proxy/nrp-user-service.js';

import './nrp-header.css';

export default class NrpHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      proxyConnected: NrpUserService.instance.userIsSet()
    };
  }

  componentDidMount() {
    NrpUserService.instance.on(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.on(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
    // MqttClientService.instance.connect(this.mqttBrokerUrl);
  }

  componentWillUnmount() {
    NrpUserService.instance.off(NrpUserService.EVENTS.CONNECTED, this.onProxyConnected);
    NrpUserService.instance.off(NrpUserService.EVENTS.DISCONNECTED, this.onProxyDisconnected);
  }

  onProxyConnected = () => {
    this.setState({ proxyConnected: true});
  }

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
            <Link to='/experiments-overview'
              className={this.state.proxyConnected ? 'header-link' : 'header-link-disabled'}>
              EXPERIMENTS
            </Link>
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
