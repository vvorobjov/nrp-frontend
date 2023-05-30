
/* export const mockgetStoredLocalToken = jest.fn();

const AthenticationServiceMock = jest.fn().mockImplementation(() => {
    return { instance: { getStoredLocalToken: mockgetStoredLocalToken } };
}); */
class AuthenticationService {
  constructor() {
    this.checkForNewTokenToStore();
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

  }

  /**
     * Get the stored access token.
     *
     * @return token The stored access token. Or strings identifying 'no-token' / 'malformed-token'.
     */
  getStoredLocalToken() {
    return 'fakeToken';
  }

  /**
     * Makes the local authentication.
     *
     * @param {*} config Authentication config
     */
  authLocal(config) {
  }

  /**
     * Performs authentication.
     * 
     * @param {*} config Authentication config
     */
  authenticate(config) {
  }
};

export default AuthenticationService;