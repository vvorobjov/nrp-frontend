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

  test('the experiments service instance always refers to the same object', () => {
    const instance1 = AuthenticationService.instance;
    const instance2 = AuthenticationService.instance;
    expect(instance1).toBe(instance2);
  });

  test('checks the URL for new tokens to store', () => {
    let baseURL = AuthenticationService.instance.STORAGE_KEY;
    let accessToken = 'test-access-token';

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

    // token parsing error
    localStorage.getItem.mockReturnValue({});
    token = AuthenticationService.instance.getStoredLocalToken();
    expect(token).toEqual(AuthenticationService.CONSTANTS.MALFORMED_TOKEN);
  });

  test('init() with OIDC enabled', async () => {
    jest.spyOn(AuthenticationService.instance, 'authCollab').mockResolvedValue();
    AuthenticationService.instance.oidcEnabled = true;

    AuthenticationService.instance.authenticate();
    await AuthenticationService.instance.promiseInitialized;
    expect(AuthenticationService.instance.authCollab).toHaveBeenCalled();
    expect(AuthenticationService.instance.initialized).toBeTruthy();
  });

  test('init() with OIDC enabled, failed collab authentication', async () => {
    jest.spyOn(AuthenticationService.instance, 'authCollab').mockRejectedValue('failed');
    AuthenticationService.instance.oidcEnabled = true;

    try {
      AuthenticationService.instance.init();
      await AuthenticationService.instance.promiseInitialized;
    }
    catch (error) {
      //console.error(error);
    }
    /*expect(async () => {
      AuthenticationService.instance.init();
      await AuthenticationService.instance.promiseInitialized;
    }).toThrowError('failed');*/
    expect(AuthenticationService.instance.authCollab).toHaveBeenCalled();
    expect(AuthenticationService.instance.initialized).toBeFalsy();
  });

  test('can redirect to the authentication page', () => {
    jest.spyOn(AuthenticationService.instance, 'clearStoredLocalToken');

    let orginalLocationURL = 'http://some.url/';
    window.location.href = orginalLocationURL;
    AuthenticationService.instance.authLocal({});
    test('can redirect to the local authentication page', async () => {
      let originalLocationURL = 'http://some.url/';
      window.location.href = originalLocationURL;
      AuthenticationService.instance.oidcEnabled = false;
      await AuthenticationService.instance.authenticate({ force: true });
      expect(window.location.href).toBe(AuthenticationService.instance.authURL +
        `&client_id=${AuthenticationService.instance.clientId}&redirect_uri=${encodeURIComponent(originalLocationURL)}`);
    });
  })
});
