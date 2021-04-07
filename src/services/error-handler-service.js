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

  emitNetworkError(error) {
    error.type = 'Network Error';
    this.emit(ErrorHandlerService.EVENTS.ERROR, error);
  }
}

ErrorHandlerService.EVENTS = Object.freeze({
  ERROR: 'ERROR'
});

export default ErrorHandlerService;