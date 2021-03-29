import { EventEmitter } from 'events';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service that handles error retrieving from http and opening error dialog in App.js
 */
class ErrorHandlerService extends EventEmitter{
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.startUpdates();
    window.addEventListener('beforeunload', (event) => {
      this.stopUpdates();
      event.returnValue = '';
    });
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ErrorHandlerService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Start polling updates.
   */
  startUpdates() {
    this.getError();
    this.intervalPollError = setInterval(
      () => {
        this.getError();
      },
      ErrorHandlerService.CONSTANTS.INTERVAL_POLL_ERROR
    );
  }

  /**
   * Stop polling updates.
   */
  stopUpdates() {
    this.intervalPollError && clearInterval(this.intervalPollError);
  }

  /**
   * Update the error in App.js.
   */
  getError(error){
    this.error = error;
    this.emit(ErrorHandlerService.EVENTS.UPDATE_ERROR, this.error);
  }
}

ErrorHandlerService.EVENTS = Object.freeze({
  UPDATE_ERROR: 'UPDATE_ERROR'
});

ErrorHandlerService.CONSTANTS = Object.freeze({
  INTERVAL_POLL_ERROR: 1000
});


export default ErrorHandlerService;