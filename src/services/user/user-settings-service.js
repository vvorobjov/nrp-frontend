let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service handling user settings
 */
export default class UserSettingsService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use' + this.constructor.name + '.instance');
    }

    this.settingsData = {};
  }

  static get instance() {
    if (_instance == null) {
      _instance = new UserSettingsService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  saveSettings(settingsData) {
    this.settingsData = settingsData;
  }
}