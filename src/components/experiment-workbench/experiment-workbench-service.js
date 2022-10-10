let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling server resources for simulating experiments.
 */
class ExperimentWorkbenchService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ExperimentWorkbenchService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  get experimentInfo() {
    return this.expInfo;
  }
  set experimentInfo(info) {
    this.expInfo = info;
    console.info(['ExperimentWorkbenchService - experimentInfo', this.expInfo]);
  }
}

export default ExperimentWorkbenchService;
