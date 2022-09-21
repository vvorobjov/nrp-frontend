/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import { HttpService } from '../http-service';
import AuthenticationService from '../authentication-service';

const mockURL = 'http://test.url';

test('has a generic request interface', async () => {
  let mockAuthToken = 'test-auth-token';
  jest.spyOn(AuthenticationService.instance, 'getToken').mockReturnValue(mockAuthToken);
  //jest.spyOn(AuthenticationService.instance, 'openAuthenticationPage').mockImplementation();
  let mockFetchReturnValue = {
    ok: true
  };
  jest.spyOn(window, 'fetch').mockReturnValue(mockFetchReturnValue);

  let httpService = new HttpService();
  let options = {
    headers: {},
    body: {}
  };
  let data = {};

  // with response ok
  let response = await httpService.performRequest(mockURL, options, data);
  expect(window.fetch).toHaveBeenCalledWith(mockURL, options);
  expect(options.headers.Authorization).toBe(`Bearer ${AuthenticationService.instance.getStoredToken()}`);
  expect(options.body).toBe(data);

  // response with status 477
  mockFetchReturnValue.ok = false;
  mockFetchReturnValue.status = 477;
  let responseText = 'auth-url';
  mockFetchReturnValue.text = jest.fn().mockReturnValue(responseText);
  response = await httpService.performRequest(mockURL, options, data);
  expect(AuthenticationService.instance.openAuthenticationPage).toHaveBeenLastCalledWith(responseText);

  // response with status 478
  mockFetchReturnValue.status = 478;
  response = await httpService.performRequest(mockURL, options, data);
  expect(response.status).toBe(478);
});

test('has a GET request interface', async () => {
  let httpService = new HttpService();
  let mockResponse = {};
  jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

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

test('has a POST request interface', async () => {
  let httpService = new HttpService();
  let mockResponse = {};
  let mockData = {};
  jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

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

test('has a PUT request interface', async () => {
  let httpService = new HttpService();
  let mockResponse = {};
  let mockData = {};
  jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

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

test('has a DELETE request interface', async () => {
  let httpService = new HttpService();
  let mockResponse = {};
  jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

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

test('options can be redefined', async () => {
  let httpService = new HttpService();
  let options = {};

  httpService.setOptions(options);
  expect(httpService.options).toBe(options);
});
