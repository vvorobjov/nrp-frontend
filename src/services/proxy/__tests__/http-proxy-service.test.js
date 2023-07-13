/**
 * @jest-environment jsdom
*/
import '@testing-library/jest-dom';

import { HttpProxyService } from '../http-proxy-service';
import EventProxyService from '../event-proxy-service';
jest.mock('../../authentication-service.js');

const mockURL = 'http://test.url';
const mockEndpoint = '/test/endpoint';

describe('HttpProxyService', () => {

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

    expect(httpService.createRequestURL()).toEqual('/');
    expect(httpService.createRequestURL('/endpoint')).toEqual('/endpoint');
    expect(httpService.createRequestURL('/api/endpoint')).toEqual('/api/endpoint');
    expect(httpService.createRequestURL('/api/endpoint', {q: 'a'})).toEqual('/api/endpoint?q=a');
    expect(httpService.createRequestURL('/api', {q: 'a', a: 'q'})).toEqual('/api?q=a&a=q');
    expect(httpService.createRequestURL('/api', {q: 'a', a: 'q'}, 'tag')).toEqual('/api?q=a&a=q#tag');
  });

  test('emits DISCONNECTED after 3 subsequent failed requests', async () => {
    let mockResponse = {};

    const httpService = new HttpProxyService();
    let spyFetch = jest.spyOn(global, 'fetch');

    // Prepare fetch mock to throw exceptions
    spyFetch.mockImplementationOnce(() => Promise.reject('Failed request'));
    spyFetch.mockImplementationOnce(() => Promise.reject('Failed request'));
    spyFetch.mockImplementationOnce(() =>
      Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({}) })
    );
    spyFetch.mockImplementationOnce(() => Promise.reject('Failed request'));
    spyFetch.mockImplementationOnce(() => Promise.reject('Failed request'));
    spyFetch.mockImplementationOnce(() => Promise.reject('Failed request'));
    
    // Mock the emitDisconnected method
    const emitDisconnectedSpy = jest.spyOn(EventProxyService.instance, 'emitDisconnected');
    const emitConnectedSpy = jest.spyOn(EventProxyService.instance, 'emitConnected');

    // The first 2 requests should be 404 but not emit DISCONNECTED
    expect((await httpService.httpRequestGET(mockEndpoint)).ok).toBe(false);
    expect((await httpService.httpRequestGET(mockEndpoint)).ok).toBe(false);
    // The OK request should reset the counter
    expect((await httpService.httpRequestGET(mockEndpoint)).ok).toBe(true);
    expect(emitConnectedSpy).toHaveBeenCalledTimes(1);

    expect((await httpService.httpRequestGET(mockEndpoint)).ok).toBe(false);
    expect((await httpService.httpRequestGET(mockEndpoint)).ok).toBe(false);
    expect(emitDisconnectedSpy).not.toHaveBeenCalled();
    try {
      await httpService.httpRequestGET(mockEndpoint);
    }
    catch (error) {
      expect(emitDisconnectedSpy).toHaveBeenCalledTimes(1);
    }
  });
});