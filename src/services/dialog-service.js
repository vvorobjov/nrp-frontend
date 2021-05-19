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

  // HTTP request error
  networkError(error) {
    error.type = 'Network Error';
    this.emit(DialogService.EVENTS.ERROR, error);
  }

  // Handling data error
  dataError(error){
    error.type = 'Data Error';
    this.emit(DialogService.EVENTS.ERROR, error);
  }

  simulationError(error) {
    error.type = 'Simulation Error';
    this.emit(DialogService.EVENTS.ERROR, error);
  }

  progressNotification(notification) {
    notification.type = 'Progress Status';
    this.emit(DialogService.EVENTS.NOTIFICATION, notification)
  }

  warningNotification(notification) {
    notification.type = 'Warning'
    this.emit(DialogService.EVENTS.NOTIFICATION, notification)
  }
  
}

DialogService.EVENTS = Object.freeze({
  ERROR: 'ERROR'
});

DialogService.EVENTS = Object.freeze({
  NOTIFICATION: 'NOTIFICATION'
})

export default DialogService;