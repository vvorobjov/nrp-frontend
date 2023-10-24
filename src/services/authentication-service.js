import config from '../config.json';
import Keycloak from 'keycloak-js';

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

    if (!this.oidcEnabled) {
      this.checkForNewLocalTokenToStore();
      this.promiseInitialized = Promise.resolve();
    }
    else {
      this.authenticate();
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new AuthenticationService(SINGLETON_ENFORCER);
    }
    return _instance;
  }

  authenticate(config) {
    if (this.promiseInitialized && config && !config.force) {
      return this.promiseInitialized;
    }

    this.promiseInitialized = new Promise(async (resolve, reject) => {
      this.authURL = this.authURL || config.url;
      if (this.oidcEnabled) {
        try {
          let success = await this.authCollab();
          success ? resolve() : reject();
        }
        catch (error) {
          console.error(error);
          reject();
        }
      }
      else {
        this.authLocal(config);
        resolve();
      }
    });

    return this.promiseInitialized;
  }

  getToken() {
    if (this.oidcEnabled) {
      if (this.keycloakClient && this.keycloakClient.token) {
        this.keycloakClient
          .updateToken(30).then(refreshed => {
            if (refreshed) {
              console.info('token refreshed');
            }
          })
          .catch(() => {
            console.error('Failed to refresh token');
          });
        return this.keycloakClient.token;
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
      if (this.keycloakClient && this.keycloakClient.authenticated) {
        this.keycloakClient.logout();
        this.keycloakClient.clearStoredLocalToken();
      }
      else {
        console.error('Client is not authenticated');
      }
    }
    else {
      return this.clearStoredLocalToken();
    }
  }

  authLocal(customConfig) {
    this.authURL = this.authURL || customConfig.url;
    this.clientId = this.clientId || customConfig.clientId;

    let absoluteUrl = /^https?:\/\//i;
    if (!absoluteUrl.test(this.authURL)) {
      this.authURL = `${this.proxyURL}${this.authURL}`;
    }

    this.clearStoredLocalToken();
    window.location.href = `${this.authURL}&client_id=${this
      .clientId}&redirect_uri=${encodeURIComponent(window.location.href)}`;

    return true;
  }

  checkForNewLocalTokenToStore() {
    // const path = window.location.pathname;
    const path = window.location.href;

    const accessTokenMatch = /&access_token=([^&]*)/.exec(path);
    if (!accessTokenMatch || !accessTokenMatch[1]) {
      return false;
    }

    let accessToken = accessTokenMatch[1];
    localStorage.setItem(
      this.STORAGE_KEY,
      //eslint-disable-next-line camelcase
      JSON.stringify([{ access_token: accessToken }])
    );

    // navigate to clean url
    let cleanedPath = path.substr(0, path.indexOf('&'));
    window.location.href = cleanedPath;

    return true;
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

  async authCollab() {
    try {
      let authenticated = await this.initKeycloakClient();
      if (authenticated) {
        return true;
      }
      else {
        await this.keycloakClient.login({ scope: 'openid profile email group team' });
        return true;
      }
    }
    catch (error) {
      console.error(error);
      return false;
    }
  }

  async initKeycloakClient() {
    this.keycloakClient = new Keycloak({
      realm: 'hbp',
      clientId: this.clientId,
      //'public-client': true,
      'confidential-port': 0,
      url: this.authURL,
      redirectUri: window.location.href
    });
    /*this.keycloakClient.onReady = (authenticated) => {};
    this.keycloakClient.onAuthSuccess = () => {};
    this.keycloakClient.onAuthError = (...params) => {};*/
    this.keycloakClient.onTokenExpired = (...params) => {
      this.keycloakClient
        .updateToken().then(refreshed => {
          if (refreshed) {
            console.info('token refreshed');
          }
        })
        .catch(() => {
          console.error('Failed to refresh token');
        });
    };

    let authenticated = await this.keycloakClient.init({
      flow: 'standard',
      pkceMethod: 'S256', /*, responseMode: 'fragment'*/
      checkLoginIframe: false
    });

    return authenticated;
  }
}

AuthenticationService.CONSTANTS = Object.freeze({
  MALFORMED_TOKEN: 'malformed-token',
  NO_TOKEN: 'no-token'
});

export default AuthenticationService;