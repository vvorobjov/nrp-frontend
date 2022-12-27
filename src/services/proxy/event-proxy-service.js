/**
 * @copyright Copyright © 2023 Human Brain Project. All Rights Reserved.
 * @url       https://neurorobotics.net/
 * @file      This files defines the EventProxyService class.
 * @author    Viktor Vorobev <vorobev@in.tum.de>
 * @since     1.0.0
 */

import { EventEmitter } from 'events';
import { NRPProxyError } from './http-proxy-service';
import DialogService from '../dialog-service';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling the state and the events of the proxy.
 *
 * @augments EventEmitter
 */
export default class EventProxyService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.connected = false;
    this.initialized = false;

    // add onConnected and onDisconnected functions to the events listeners
    this.on(EventProxyService.EVENTS.CONNECTED, this.onConnected);
    this.on(EventProxyService.EVENTS.DISCONNECTED, this.onDisconnected);
  }

  static get instance() {
    if (_instance == null) {
      _instance = new EventProxyService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  isConnected() {
    return this.connected;
  }

  /**
   * Emits CONNECTED event once per session.
   *
   * @fires EventProxyService.EVENTS.CONNECTED
   */
  emitConnected(dataObj){
    if (!this.connected){
      this.emit(EventProxyService.EVENTS.CONNECTED, dataObj);
    }
  }

  /**
   * Emits DISCONNECTED event once per broken connection.
   *
   * @fires EventProxyService.EVENTS.DISCONNECTED
   *
   * @param {object} dataObj is a objest with `code` and `data` fields
   * which are displayed in the dialog together with the `stack`
   */
  emitDisconnected(dataObj){
    if (this.connected || !this.initialized){
      this.emit(EventProxyService.EVENTS.DISCONNECTED, dataObj);
    }
  }

  /**
   * Fires notification on re-connection.
   *
   * @listens EventProxyService.EVENTS.CONNECTED
   */
  onConnected(){
    this.connected = true;
    // skip notification at the first connection
    if (this.initialized){
      DialogService.instance.nrpNotification({
        message: 'Proxy is connected again!',
        type: 'Proxy Notification'
      });
    }
    else {
      this.initialized = true;
    }
  }


  /**
   * Throws NRPProxyError exception when connection is lost.
   *
   * @listens EventProxyService.EVENTS.DISCONNECTED
   *
   * @param {object} obj is a objest with `code` and `data` fields
   * which are displayed in the dialog together with the `stack`
   */
  onDisconnected(obj){
    this.connected = false;
    if (!this.initialized) {
      this.initialized = true;
    }
    throw new NRPProxyError(
      'Failed to communicate with proxy.',
      obj.code,//requestURL.href,
      obj.data//JSON.stringify(options, null, 4)
    );
  }

}

EventProxyService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED'
});