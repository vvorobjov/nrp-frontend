
/* export const mockGetStoredToken = jest.fn();

const AthenticationServiceMock = jest.fn().mockImplementation(() => {
    return { instance: { getStoredToken: mockGetStoredToken } };
}); */
class AuthenticationService {
  constructor() {

  }

  static get instance() {
    return new AuthenticationService()
  }

  /**
     * Checks if the current page URL contains access tokens.
     * This happens when the successfully logging in at the proxy login page and being redirected back with the token info.
     * Will automatically remove additional access info and present a clean URL after being redirected.
     */
  checkForNewTokenToStore() {

  }
  /**
     * Clear currently stored access token.
     */
  clearStoredToken() {

  }

  /**
     * Get the stored access token.
     *
     * @return token The stored access token. Or strings identifying 'no-token' / 'malformed-token'.
     */
  getStoredToken() {
    return 'fakeToken';
  }

  /**
     * Opens the proxy's authentication page.
     *
     * @param {*} url The URL of the authentication page. If not an absolute URL it is assumed to be a subpage of the proxy.
     */
  openAuthenticationPage(url) {

  }
};

export default AuthenticationService;