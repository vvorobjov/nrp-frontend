import config from '../config.json';

/* global Keycloak */

let keycloakClient = undefined;

const INIT_CHECK_INTERVAL_MS = 100;
const INIT_CHECK_MAX_RETRIES = 10;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class AuthenticationService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }

    this.proxyURL = config.api.proxy.url;
    this.oidcEnabled = config.auth.enableOIDC;
    this.clientId = config.auth.clientId;
    this.authURL = config.auth.url;
    this.STORAGE_KEY = `tokens-${this.clientId}@https://iam.ebrains.eu/auth/realms/hbp`;

    this.init();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new AuthenticationService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  init() {
    this.initialized = false;
    if (this.oidcEnabled) {
      this.authCollab().then(() => {
        this.initialized = true;
      });
    }
    else {
      this.checkForNewLocalTokenToStore();
      this.initialized = true;
    }

    this.promiseInitialized = new Promise((resolve, reject) => {
      let numChecks = 0;
      let checkInterval = setInterval(() => {
        numChecks++;
        if (numChecks > INIT_CHECK_MAX_RETRIES) {
          clearInterval(checkInterval);
          reject();
        }
        if (this.initialized) {
          clearInterval(checkInterval);
          resolve();
        }
      }, INIT_CHECK_INTERVAL_MS);
    });
  }

  authenticate(config) {
    if (this.oidcEnabled) {
      this.authCollab(config);
    }
    else {
      this.authLocal(config);
    }
  }

  getToken() {
    if (this.oidcEnabled) {
      if (keycloakClient && keycloakClient.authenticated) {
        keycloakClient
          .updateToken(30)
          .then(function() {})
          .catch(function() {
            console.error('Failed to refresh token');
          });
        return keycloakClient.token;
      }
      else {
        console.error('getToken() - Client is not authenticated');
      }
    }
    else {
      return this.getStoredLocalToken();
    }
  }

  logout() {
    if (this.oidcEnabled) {
      if (keycloakClient && keycloakClient.authenticated) {
        keycloakClient.logout();
        keycloakClient.clearStoredLocalToken();
      }
      else {
        console.error('Client is not authenticated');
      }
    }
    else {
      return this.clearStoredLocalToken();
    }
  }

  authLocal(config) {
    if (this.authenticating) {
      return;
    }
    this.authenticating = true;

    this.authURL = this.authURL || config.url;
    this.clientId = this.clientId || config.clientId;

    let absoluteUrl = /^https?:\/\//i;
    if (!absoluteUrl.test(this.authURL)) {
      this.authURL = `${this.proxyURL}${this.authURL}`;
    }

    this.clearStoredLocalToken();
    window.location.href = `${this.authURL}&client_id=${this
      .clientId}&redirect_uri=${encodeURIComponent(window.location.href)}`;
  }

  checkForNewLocalTokenToStore() {
    const path = window.location.pathname;

    const accessTokenMatch = /&access_token=([^&]*)/.exec(path);
    if (!accessTokenMatch || !accessTokenMatch[1]) {
      return;
    }

    let accessToken = accessTokenMatch[1];
    localStorage.setItem(
      this.STORAGE_KEY,
      //eslint-disable-next-line camelcase
      JSON.stringify([{ access_token: accessToken }])
    );

    // navigate to clean url
    let cleanedPath = path.substr(0, path.indexOf('&'));
    window.location = cleanedPath;
  }

  clearStoredLocalToken() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getStoredLocalToken() {
    let storedItem = localStorage.getItem(this.STORAGE_KEY);
    if (!storedItem) {
      // this token will be rejected by the server and the client will get a proper auth error
      return 'no-token';
    }

    try {
      let tokens = JSON.parse(storedItem);
      return tokens.length ? tokens[tokens.length - 1].access_token : null;
    }
    catch (e) {
      // this token will be rejected by the server and the client will get a proper auth error
      return 'malformed-token';
    }
  }

  authCollab(config) {
    if (this.authenticating) {
      return;
    }
    this.authenticating = true;

    return new Promise(resolve => {
      this.authURL = this.authURL || config.url;

      this.initKeycloakClient().then(() => {
        if (!keycloakClient.authenticated) {
          // User is not authenticated, run login
          keycloakClient
            .login({ scope: 'openid profile email group' })
            .then(() => {
              resolve(true);
            });
        }
        else {
          keycloakClient.loadUserInfo().then(userInfo => {
            this.userInfo = userInfo;
            resolve(true);
          });
        }
      });
    });
  }

  initKeycloakClient() {
    return new Promise(resolve => {
      keycloakClient = Keycloak({
        realm: 'hbp',
        clientId: this.clientId,
        //'public-client': true,
        'confidential-port': 0,
        url: this.authURL,
        redirectUri: window.location.href // 'http://localhost:9001/#/esv-private' //
      });

      keycloakClient
        .init({
          flow: 'hybrid' /*, responseMode: 'fragment'*/
        })
        .then(() => {
          resolve(keycloakClient);
        });
    });
  }
}

AuthenticationService.CONSTANTS = Object.freeze({
  MALFORMED_TOKEN: 'malformed-token',
  NO_TOKEN: 'no-token'
});

export default AuthenticationService;
