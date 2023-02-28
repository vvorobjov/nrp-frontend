import _ from 'lodash';

import NrpUserService from './proxy/nrp-user-service.js';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

let durationClocks = {};

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class NrpAnalyticsService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new NrpAnalyticsService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  eventTrack(actionName, options) {
    if (_.isObject(options) && _.isBoolean(options.value)) {
      options.value = _.toInteger(options.value);
    }
    return NrpUserService.instance.getCurrentUser().then((user) => {
      /*var extendedOptions = _.extend(options, {
        label: user.displayName
      });
      $analytics.eventTrack(actionName, extendedOptions);*/
      console.error('implement $analytics.eventTrack(actionName, extendedOptions)');
    });
  }

  tickDurationEvent(actionName) {
    durationClocks[actionName] = Date.now();
  }

  durationEventTrack(actionName, options) {
    if (_.isUndefined(durationClocks[actionName])) {
      console.debug('Analytics duration: missing tick for action: ' + actionName);
      return;
    }
    var duration = Date.now() - durationClocks[actionName];
    var extendedOptions = _.extend(options, {
      value: duration / 1000
    });
    this.eventTrack(actionName, extendedOptions);
    delete durationClocks[actionName];
  }
}

export default NrpAnalyticsService;
