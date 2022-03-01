import { EventEmitter } from 'events';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles error retrieving from http and opening error dialog in App.js
 * An Error object has 5 attributes among which 2 are required:
 *  - type: category (network ...) | required
 *  - message: details | required
 *  - code: error line | optional
 *  - data: related content | optional
 *  - stack: call stack | optional
 */
class DialogService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new DialogService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  info(notification) {
    notification.type = DialogService.CONSTANTS.INFO;
    this.emit(DialogService.EVENTS.NOTIFICATION, notification);
  }

  warning(notification) {
    notification.type = DialogService.CONSTANTS.WARNING;
    this.emit(DialogService.EVENTS.NOTIFICATION, notification);
  }

  error(notification) {
    notification.type = DialogService.CONSTANTS.ERROR;
    this.emit(DialogService.EVENTS.NOTIFICATION, notification);
  }

  /* special error callbacks */

  // HTTP request error
  networkError(message) {
    this.error({ title: 'Network Error', message: message });
  }

  // Handling data error
  dataError(message){
    this.error({ title: 'Data Error', message: message });
  }

  simulationError(message) {
    this.error({ title: 'Simulation Error', message: message });
  }
}

DialogService.EVENTS = Object.freeze({
  NOTIFICATION: 'NOTIFICATION'
});

DialogService.CONSTANTS = Object.freeze({
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
});

export default DialogService;