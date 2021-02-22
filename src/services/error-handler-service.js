let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class ErrorHandlerService{
  constructor(enforcer) {
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

  displayServerHTTPError(error) {
    //TODO: needs proper UI implementation
    console.error(error);
  }

  onErrorSimulationUpdate(error) {
    //TODO: needs proper UI implementation
    console.error(error);
  }

  displayError (error){
    //TODO: needs proper implementation
    console.error(error.type + error.message);
  }
}

export default ErrorHandlerService;
