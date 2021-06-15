import config from '../config.json';

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

    this.CLIENT_ID = config.authV2.clientId;
    this.CLIENT_SECRET = config.authV2.secret;
    this.STORAGE_KEY = `tokens-${this.CLIENT_ID}@https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/auth`;

    this.redirectToAuthPage = true;
    this.checkForSessionStateAndAuthCode();
    //this.checkForNewTokenToStore();
  }

  static get instance() {
    if (_instance == null) {
      _instance = new AuthenticationService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Checks if the current page URL contains access tokens.
   * This happens when the successfully logging in at the proxy login page and
   * being redirected back with the token info.
   * Will automatically remove additional access info and present a clean URL after being redirected.
   */
  checkForNewTokenToStore() {
    const path = window.location.href;
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
    const pathMinusAccessToken = path.substr(0, path.indexOf('&access_token='));
    window.location.href = pathMinusAccessToken;
  }

  /**
   * Checks if the current page URL contains access tokens.
   * This happens when the successfully logging in at the proxy login page and
   * being redirected back with the token info.
   * Will automatically remove additional access info and present a clean URL after being redirected.
   */
  checkForSessionStateAndAuthCode() {
    const path = window.location.href;
    const sessionStateMatch = /&session_state=([^&]*)/.exec(path);
    const authCodeMatch = /&code=([^&]*)/.exec(path);

    if (!sessionStateMatch || !authCodeMatch[1]) {
      return;
    }

    this.redirectToAuthPage = false;

    let sessionState = sessionStateMatch[1];
    let authCode = authCodeMatch[1];
    console.info({sessionState: sessionState, authCode: authCode});

    this.getAccessToken(authCode);

    /*localStorage.setItem(
      this.STORAGE_KEY,
      //eslint-disable-next-line camelcase
      JSON.stringify([{ access_token: accessToken }])
    );*/
    //const pathMinusAccessToken = path.substr(0, path.indexOf('?'));
    //window.location.href = pathMinusAccessToken;
  }

  async getAccessToken(authenticationCode) {
    console.info(authenticationCode);
    /*let urlRequestAccessToken = 'https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token?'
      + 'grant_type=authorization_code'
      + '&client_id=' + this.CLIENT_ID
      + '&redirect_uri=' + window.location.origin
      + '&code=' + authenticationCode
      + '&client_secret=' + this.CLIENT_SECRET;*/
    let urlRequestAccessToken = 'https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token';

    let options = {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        //'Access-Control-Allow-Origin': '*',
        Referer: window.location.origin
      },
      // redirect: manual, *follow, error
      redirect: 'follow',
      // referrerPolicy: no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin,
      // strict-origin, strict-origin-when-cross-origin, unsafe-url
      referrerPolicy: 'no-referrer'
    };

    options.body = JSON.stringify({
      grant_type: 'authorization_code',
      client_id: this.CLIENT_ID,
      redirect_uri: window.location.origin,
      client_secret: this.CLIENT_SECRET,
      code: authenticationCode
    });

    const responseAccessTokenRequest = await fetch(urlRequestAccessToken, options);
    console.info(responseAccessTokenRequest);
    /*const responseJSON = await responseAccessTokenRequest.json();
    console.info(responseJSON);*/
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
      return AuthenticationService.CONSTANTS.NO_TOKEN;
    }

    try {
      let tokens = JSON.parse(storedItem);
      return tokens.length ? tokens[tokens.length - 1].access_token : null;
    }
    catch (e) {
      // this token will be rejected by the server and the client will get a proper auth error
      return AuthenticationService.CONSTANTS.MALFORMED_TOKEN;
    }
  }

  /**
   * Opens the proxy's authentication page.
   *
   * @param {*} url The URL of the authentication page.
   * If not an absolute URL it is assumed to be a subpage of the proxy.
   */
  openAuthenticationPage(url = config.authV2.url) {
    if (!this.redirectToAuthPage) {
      return;
    }

    this.clearStoredToken();

    let absoluteUrl = /^https?:\/\//i;
    if (!absoluteUrl.test(url)) {
      url = `https://${url}`;
    }
    /*window.location.href = `${url}
      &client_id=${this.CLIENT_ID}
      &redirect_uri=${encodeURIComponent(window.location.href)}`;*/

    let testClientID = 'community-apps-tutorial';
    let testRedirectURI = window.location.href; //'http://localhost:3000';
    window.location.href = url +
      '&client_id=' + testClientID +
      '&redirect_uri=' + testRedirectURI;
  }
}

AuthenticationService.CONSTANTS = Object.freeze({
  MALFORMED_TOKEN: 'malformed-token',
  NO_TOKEN: 'no-token'
});

export default AuthenticationService;
