/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import AuthenticationService from '../authentication-service';

//import MockLocalShorage from '../__mocks__/local-storage.mock';

/*beforeEach(() => {
  jest.mock('global.localStorage');
});*/

/*beforeEach(() => {
  jest.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  localStorage.setItem.mockRestore();
});*/

test('makes sure that invoking the constructor fails with the right message', () => {
  expect(() => {
    new AuthenticationService();
  }).toThrow(Error);
  expect(() => {
    new AuthenticationService();
  }).toThrowError(Error('Use AuthenticationService.instance'));
});

test('the experiments service instance always refers to the same object', () => {
  const instance1 = AuthenticationService.instance;
  const instance2 = AuthenticationService.instance;
  expect(instance1).toBe(instance2);
});

test('checks the URL for new tokens to store', () => {
  let baseURL = 'http://some.url/';
  let accessToken = 'test-access-token';

  delete window.location;
  window.location = {
    href: baseURL + '&access_token=' + accessToken
  };

  AuthenticationService.instance.checkForNewTokenToStore();
  expect(localStorage.setItem).toHaveBeenCalledWith(
    AuthenticationService.instance.STORAGE_KEY, JSON.stringify([{ access_token: accessToken }])
  );
  expect(window.location.href).toBe(baseURL);
});

test('can clear stored authentication tokens', () => {
  AuthenticationService.instance.clearStoredToken();
  expect(localStorage.removeItem).toHaveBeenCalledWith(AuthenticationService.instance.STORAGE_KEY);
});

test('can retrieve stored authentication tokens', () => {
  let mockToken = 'test-auth-token';
  jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify([{
    access_token: mockToken
  }]));
  let token = AuthenticationService.instance.getStoredToken();
  expect(token).toEqual(mockToken);

  // token parsing error
  localStorage.getItem.mockReturnValue({});
  token = AuthenticationService.instance.getStoredToken();
  expect(token).toEqual(AuthenticationService.CONSTANTS.MALFORMED_TOKEN);
});

test('can redirect to the authentication page', () => {
  jest.spyOn(AuthenticationService.instance, 'clearStoredToken');

  let orginalLocationURL = 'http://some.url/';
  window.location.href = orginalLocationURL;
  let authURL = '/test-auth-page';
  AuthenticationService.instance.openAuthenticationPage(authURL);
  expect(window.location.href).toBe(AuthenticationService.instance.PROXY_URL + authURL +
    `&client_id=${AuthenticationService.instance.CLIENT_ID}&redirect_uri=${encodeURIComponent(orginalLocationURL)}`);
});