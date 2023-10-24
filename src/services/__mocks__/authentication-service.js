import { resolve } from 'path';

class AuthenticationService {
  constructor() {
    this.checkForNewTokenToStore();
    this.PromiseInitialized = new Promise(()=>resolve());
  }

  static get instance() {
    return new AuthenticationService();
  }

  /**
     * Checks if the current page URL contains access tokens.
     * This happens when the successfully logging in at the proxy login page and
     * being redirected back with the token info.
     * Will automatically remove additional access info and present a clean URL after being redirected.
     */
  checkForNewTokenToStore() {

  }
  /**
     * Clear currently stored access token.
     */
  clearStoredLocalToken() {
  clearStoredLocalToken() {

  }

  /**
     * Get the stored access token.
     *
     * @return token The stored access token. Or strings identifying 'no-token' / 'malformed-token'.
     */
  getStoredLocalToken() {
    return 'test-auth-token';
  }

  getToken() {
    return 'test-auth-token';
  }
  /**
     * Makes the local authentication.
     * Makes the local authentication.
     *
     * @param {*} config Authentication config
     */
  authLocal(config) {
  }

  /**
     * Performs authentication.
     */
  authenticate() {
  }
};

export default AuthenticationService;