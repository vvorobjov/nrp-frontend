import config from '../config.json';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service taking care of OIDC/FS authentication for NRP accounts
 */
class AuthenticationService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use AuthenticationService.instance');
    }

    this.CLIENT_ID = config.auth.clientId;
    this.STORAGE_KEY = `tokens-${this.CLIENT_ID}@https://services.humanbrainproject.eu/oidc`;
    this.PROXY_URL = config.api.proxy.url;

    this.checkForNewTokenToStore();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new AuthenticationService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Checks if the current page URL contains access tokens.
   * This happens when the successfully logging in at the proxy login page and being redirected back with the token info.
   * Will automatically remove additional access info and present a clean URL after being redirected.
   */
  checkForNewTokenToStore() {
    const path = window.location.href;
    const accessTokenMatch = /&access_token=([^&]*)/.exec(path);

    if (!accessTokenMatch || !accessTokenMatch[1]) return;

    let accessToken = accessTokenMatch[1];

    localStorage.setItem(
      this.STORAGE_KEY,
      //eslint-disable-next-line camelcase
      JSON.stringify([{ access_token: accessToken }])
    );
    const pathMinusAccessToken = path.substr(0, path.indexOf('&access_token='));
    window.location.href = pathMinusAccessToken;
  }

  /**
   * Clear currently stored access token.
   */
  clearStoredToken() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get the stored access token.
   *
   * @return token The stored access token. Or strings identifying 'no-token' / 'malformed-token'.
   */
  getStoredToken() {
    let storedItem = localStorage.getItem(this.STORAGE_KEY);
    if (!storedItem) {
      // this token will be rejected by the server and the client will get a proper auth error
      return 'no-token';
    }

    try {
      let tokens = JSON.parse(storedItem);
      return tokens.length ? tokens[tokens.length - 1].access_token : null;
    } catch (e) {
      // this token will be rejected by the server and the client will get a proper auth error
      return 'malformed-token';
    }
  }

  /**
   * Opens the proxy's authentication page.
   *
   * @param {*} url The URL of the authentication page. If not an absolute URL it is assumed to be a subpage of the proxy.
   */
  openAuthenticationPage(url) {
    this.clearStoredToken();

    let absoluteUrl = /^https?:\/\//i;
    if (!absoluteUrl.test(url)) url = `${this.PROXY_URL}${url}`;
    window.location.href = `${url}&client_id=${
      this.CLIENT_ID
    }&redirect_uri=${encodeURIComponent(window.location.href)}`;
  }
}

export default AuthenticationService;
