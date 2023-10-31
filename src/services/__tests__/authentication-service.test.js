/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import AuthenticationService from '../authentication-service';

beforeEach(() => {
  jest.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  localStorage.setItem.mockRestore();
});

describe('AuthenticationService', () => {

  test('makes sure that invoking the constructor fails with the right message', () => {
    expect(() => {
      new AuthenticationService();
    }).toThrow(Error);
    expect(() => {
      new AuthenticationService();
    }).toThrowError(Error('Use AuthenticationService.instance'));
  });
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
  test('the experiments service instance always refers to the same object', () => {
    const instance1 = AuthenticationService.instance;
    const instance2 = AuthenticationService.instance;
    expect(instance1).toBe(instance2);
  });

  test('checks the URL for new tokens to store', () => {
    let baseURL = AuthenticationService.instance.STORAGE_KEY;
    let accessToken = 'test-access-token';
  test('checks the URL for new tokens to store', () => {
    let baseURL = AuthenticationService.instance.STORAGE_KEY;
    let accessToken = 'test-access-token';

    delete window.location;
    window.location = {
      href: baseURL + '&access_token=' + accessToken
    };
    delete window.location;
    window.location = {
      href: baseURL + '&access_token=' + accessToken
    };

    AuthenticationService.instance.checkForNewLocalTokenToStore();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      AuthenticationService.instance.STORAGE_KEY, JSON.stringify([{ access_token: accessToken }])
    );
    expect(window.location.href).toBe(baseURL);
  });
    AuthenticationService.instance.checkForNewLocalTokenToStore();
    expect(localStorage.setItem).toHaveBeenCalledWith(
      AuthenticationService.instance.STORAGE_KEY, JSON.stringify([{ access_token: accessToken }])
    );
    expect(window.location.href).toBe(baseURL);
  });

  test('can clear stored authentication tokens', () => {
    AuthenticationService.instance.clearStoredLocalToken();
    expect(localStorage.removeItem).toHaveBeenCalledWith(AuthenticationService.instance.STORAGE_KEY);
  });
  test('can clear stored authentication tokens', () => {
    AuthenticationService.instance.clearStoredLocalToken();
    expect(localStorage.removeItem).toHaveBeenCalledWith(AuthenticationService.instance.STORAGE_KEY);
  });

  test('can retrieve stored authentication tokens', () => {
    let mockToken = 'test-auth-token';
    jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify([{
      access_token: mockToken
    }]));
    let token = AuthenticationService.instance.getStoredLocalToken();
    expect(token).toEqual(mockToken);
  test('can retrieve stored authentication tokens', () => {
    let mockToken = 'test-auth-token';
    jest.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify([{
      access_token: mockToken
    }]));
    let token = AuthenticationService.instance.getStoredLocalToken();
    expect(token).toEqual(mockToken);

    // token parsing error
    localStorage.getItem.mockReturnValue({});
    token = AuthenticationService.instance.getStoredLocalToken();
    expect(token).toEqual(AuthenticationService.CONSTANTS.MALFORMED_TOKEN);
  });
    // token parsing error
    localStorage.getItem.mockReturnValue({});
    token = AuthenticationService.instance.getStoredLocalToken();
    expect(token).toEqual(AuthenticationService.CONSTANTS.MALFORMED_TOKEN);
  });

  test('can redirect to the local authentication page', async () => {
    let originalLocationURL = 'http://some.url/';
    window.location.href = originalLocationURL;
    AuthenticationService.instance.oidcEnabled = false;
    await AuthenticationService.instance.authenticate({force: true});
    expect(window.location.href).toBe(AuthenticationService.instance.authURL +
      `&client_id=${AuthenticationService.instance.clientId}&redirect_uri=${encodeURIComponent(originalLocationURL)}`);
  });

  test('calling authenticate() while authentication is already undergoing/done (no forced re-authenticate)',
    () => {
      let mockInitializedPromise = Promise.resolve();
      AuthenticationService.instance.promiseInitialized = mockInitializedPromise;
      let authResult = AuthenticationService.instance.authenticate({force: false});
      expect(authResult).toBe(mockInitializedPromise);
    });

  test('authenticate() (Collab mode)', async () => {
    AuthenticationService.instance.oidcEnabled = true;

    // successful auth
    let spyAuthCollab = jest.spyOn(AuthenticationService.instance, 'authCollab').mockReturnValue(Promise.resolve(true));
    await expect(AuthenticationService.instance.authenticate()).resolves.toBe(undefined);

    // unsuccessful auth
    spyAuthCollab.mockReturnValue(Promise.resolve(false));
    await expect(AuthenticationService.instance.authenticate({force: true})).rejects.toBe(undefined);

    // rejected auth
    spyAuthCollab.mockReturnValue(Promise.reject());
    await expect(AuthenticationService.instance.authenticate({force: true})).rejects.toBe(undefined);
  });
});