/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';
import 'jest-fetch-mock';

import { HttpProxyService } from '../http-proxy-service';
import AuthenticationService from '../../authentication-service';

const mockURL = 'http://test.url';
const mockEndpoint = '/test/endpoint';

describe('HttpProxyService', () => {

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

    let httpService = new HttpProxyService();
    let options = {
      headers: {},
      body: {}
    };
    let data = {};

    const proxyURL = httpService.getProxyURL();
    const mockRequestURL = new URL(proxyURL.pathname + mockEndpoint, proxyURL);

    // with response ok
    let response = await httpService.performRequest(mockEndpoint, options, data);
    expect(window.fetch).toHaveBeenCalledWith(mockRequestURL, options);
    expect(options.headers.Authorization).toBe(`Bearer ${AuthenticationService.instance.getStoredLocalToken()}`);
    expect(options.body).toBe(data);

    // response with status 477
    mockFetchReturnValue.ok = false;
    mockFetchReturnValue.status = 477;
    let responseText = 'auth-url';
    mockFetchReturnValue.text = jest.fn().mockReturnValue(responseText);
    jest.spyOn(AuthenticationService.instance, 'authenticate')
    response = await httpService.performRequest(mockEndpoint, options, data);
    expect(AuthenticationService.instance.authenticate).toBeCalled();

    // response with status 478
    mockFetchReturnValue.status = 478;
    response = await httpService.performRequest(mockEndpoint, options, data);
    expect(response.status).toBe(478);
  });

  test('throws an error for the wrong url', async () => {
    let httpService = new HttpProxyService();
    await expect(httpService.performRequest(mockURL)).rejects.toEqual(
      Error('Proxy requests are expected to start with forward slash (/)'));
  });

  test('has a GET request interface', async () => {
    let httpService = new HttpProxyService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestGET(mockEndpoint);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, httpService.GETOptions);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestGET(mockEndpoint, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, options);
  });

  test('has a POST request interface', async () => {
    let httpService = new HttpProxyService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestPOST(mockEndpoint, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, httpService.POSTOptions, mockData);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPOST(mockEndpoint, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, options, mockData);
  });

  test('has a PUT request interface', async () => {
    let httpService = new HttpProxyService();
    let mockResponse = {};
    let mockData = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestPUT(mockEndpoint, mockData);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, httpService.PUTOptions, mockData);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestPUT(mockEndpoint, mockData, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, options, mockData);
  });

  test('has a DELETE request interface', async () => {
    let httpService = new HttpProxyService();
    let mockResponse = {};
    jest.spyOn(httpService, 'performRequest').mockReturnValue(mockResponse);

    // no self-defined options passed
    let response = await httpService.httpRequestDELETE(mockEndpoint);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, httpService.DELETEOptions);

    // with self-defined options passed
    let options = {};
    response = await httpService.httpRequestDELETE(mockEndpoint, options);
    expect(response).toBe(mockResponse);
    expect(httpService.performRequest).toHaveBeenCalledWith(mockEndpoint, options);
  });

  test('options can be redefined', async () => {
    let httpService = new HttpProxyService();
    let options = {};

    httpService.setOptions(options);
    expect(httpService.options).toBe(options);
  });

  test('creates the proper url path', async () => {
    let httpService = new HttpProxyService();

    expect(httpService.createRequestURL())
    .toEqual('/');
    expect(httpService.createRequestURL('/endpoint'))
    .toEqual('/endpoint');
    expect(httpService.createRequestURL('/api/endpoint'))
    .toEqual('/api/endpoint');
    expect(httpService.createRequestURL('/api/endpoint', {q: 'a'}))
    .toEqual('/api/endpoint?q=a');
    expect(httpService.createRequestURL('/api', {q: 'a', a: 'q'}))
    .toEqual('/api?q=a&a=q');
    expect(httpService.createRequestURL('/api', {q: 'a', a: 'q'}, 'tag'))
    .toEqual('/api?q=a&a=q#tag');
  });
});