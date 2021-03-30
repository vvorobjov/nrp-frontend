import { EventEmitter } from 'events';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles error retrieving from http and opening error dialog in App.js
 */
class ErrorHandlerService extends EventEmitter {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ErrorHandlerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  emitError(message) {
    let error = new Error(message);
    this.emit(ErrorHandlerService.EVENTS.ERROR, error);
  }
}

ErrorHandlerService.EVENTS = Object.freeze({
  ERROR: 'ERROR'
});

ErrorHandlerService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_ERROR: 1000
});


export default ErrorHandlerService;