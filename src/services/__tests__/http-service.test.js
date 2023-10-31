/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import { HttpService } from '../http-service';
import AuthenticationService from '../authentication-service';
jest.mock('../authentication-service.js');

const authenticateMock = jest
  .spyOn(AuthenticationService.prototype, 'authenticate');
const mockURL = 'http://test.url';

describe('HttpService', () => {

describe('HttpService', () => {

  test('has a generic request interface', async () => {
    let mockAuthToken = 'test-auth-token';
    jest.spyOn(AuthenticationService.instance, 'getStoredLocalToken').mockReturnValue(mockAuthToken);
    let mockFetchReturnValue = {
      ok: true
    };
    jest.spyOn(window, 'fetch').mockReturnValue(mockFetchReturnValue);

    let baseURL = AuthenticationService.instance.STORAGE_KEY;
    delete window.location;
    window.location = {
      href: baseURL
    };

    let httpService = new HttpService();
    let options = {
      headers: {},
      body: {}
    };
    let data = {};
    // with response ok
    let response = await httpService.performRequest(mockURL, options, data);
    expect(window.fetch).toHaveBeenCalledWith(mockURL, options);
    expect(options.headers.Authorization).toBe(`Bearer ${AuthenticationService.instance.getStoredLocalToken()}`);
    expect(options.body).toBe(data);

    // response with status 477
    mockFetchReturnValue.ok = false;
    mockFetchReturnValue.status = 477;
    let responseText = 'auth-url';
    mockFetchReturnValue.text = jest.fn().mockReturnValue(responseText);

    response = await httpService.performRequest(mockURL, options, data);

    expect(authenticateMock).toBeCalled();

    // response with status 478
    mockFetchReturnValue.status = 478;
    response = await httpService.performRequest(mockURL, options, data);
    expect(response.status).toBe(478);
  });
    // response with status 478
    mockFetchReturnValue.status = 478;
    response = await httpService.performRequest(mockURL, options, data);
    expect(response.status).toBe(478);
  });

  test('has a GET request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);
  test('has a GET request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestGET(mockURL);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.GETOptions);
    // no self-defined options passed
    let response = await httpService.httpRequestGET(mockURL);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.GETOptions);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestGET(mockURL, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options);
  });
    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestGET(mockURL, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options);
  });

  test('has a POST request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);
  test('has a POST request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestPOST(mockURL, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.POSTOptions, mockData);
    // no self-defined options passed
    let response = await httpService.httpRequestPOST(mockURL, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.POSTOptions, mockData);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPOST(mockURL, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options, mockData);
  });
    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPOST(mockURL, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options, mockData);
  });

  test('has a PUT request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);
  test('has a PUT request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestPUT(mockURL, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.PUTOptions, mockData);
    // no self-defined options passed
    let response = await httpService.httpRequestPUT(mockURL, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.PUTOptions, mockData);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPUT(mockURL, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options, mockData);
  });
    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPUT(mockURL, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options, mockData);
  });

  test('has a DELETE request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);
  test('has a DELETE request interface', async () => {
    let httpService = new HttpService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestDELETE(mockURL);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.DELETEOptions);
    // no self-defined options passed
    let response = await httpService.httpRequestDELETE(mockURL);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, httpService.DELETEOptions);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestDELETE(mockURL, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options);
  });
    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestDELETE(mockURL, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockURL, options);
  });

  test('options can be redefined', async () => {
    let httpService = new HttpService();
    let options = {};
  test('options can be redefined', async () => {
    let httpService = new HttpService();
    let options = {};

    httpService.setOptions(options);
    expect(httpService.options).toBe(options);
  });
});
    httpService.setOptions(options);
    expect(httpService.options).toBe(options);
  });
});