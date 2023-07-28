
import { EventEmitter } from 'events';

import AuthenticationService from './authentication-service';

/**
 * Base class that performs http requests with default request options.
 * If children need other options they can override the options or the
 * http verb (GET, POST, PUT etc) functions.
 */
export class HttpService extends EventEmitter {
  /**
   * Create a simple http request object with default options
   */
  constructor() {
    super();

    this.options = {
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // TODO: is it needed for referrerPolicy: 'no-referrer'?
        // Referer: 'http://localhost:9000/'
      },
      // redirect: manual, *follow, error
      redirect: 'follow',
      // referrerPolicy: no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin,
      // strict-origin, strict-origin-when-cross-origin, unsafe-url
      referrerPolicy: 'no-referrer'
      //body: JSON.stringify(data) // body data type must match "Content-Type" header
    };

    this.GETOptions = { ...this.options, ...{ method: 'GET' } };
    this.POSTOptions = { ...this.options, ...{ method: 'POST' } };
    this.PUTOptions = { ...this.options, ...{ method: 'PUT' } };
    this.DELETEOptions = { ...this.options, ...{ method: 'DELETE' } };
  }

  /**
   * Perform a generic http request with options and url
   * @param url - the url to perform the request
   * @param options - the http options object
   */
  async performRequest(url, options, data){
    // Add authorization headerasync (url)
    await AuthenticationService.instance.promiseInitialized;
    let token = AuthenticationService.instance.getToken();
    options.headers.Authorization = 'Bearer ' + token;
    if (data) {
      options.body = data;
    }

    const response = await fetch(url, options);

    // error handling
    if (!response.ok) {
      if (response.status === 477) {
        AuthenticationService.instance.authenticate();
      }
      else if (response.status === 478) {
        //TODO: redirect to maintenance page
      }

      return response;
    }

    return response;
  };

  /**
   * Perform a GET http request to a url
   * @param url - the url to perform the request
   */
  httpRequestGET = async (url, options) => {
    // copy to avoid messing up the options object in case we need to reuse it
    let { ...getOptions } = this.GETOptions;
    if (options) {
      getOptions = options;
    }
    return this.performRequest(url, getOptions);
  };

  /**
   * Perform a POST http request to a url
   * @param url - the url to perform the request
   */
  httpRequestPOST = async (url, data, options) => {
    // copy to avoid messing up the options object in case we need to reuse it
    let { ...postOptions } = this.POSTOptions;
    if (options) {
      postOptions = options;
    }
    console.info('sending my put request : ', url);
    return this.performRequest(url, postOptions, data);
  };

  /**
   * Perform a PUT http request to a url
   * @param url - the url to perform the request
   */
  httpRequestPUT = async (url, data, options) => {
    // copy to avoid messing up the options object in case we need to reuse it
    let { ...putOptions } = this.PUTOptions;
    if (options) {
      putOptions = options;
    }

    return this.performRequest(url, putOptions, data);
  };

  httpRequestDELETE = async (url, options) => {
    // copy to avoid messing up the options object in case we need to reuse it
    let { ...deleteOptions } = this.DELETEOptions;
    if (options) {
      deleteOptions = options;
    }

    return this.performRequest(url, deleteOptions);
  };
  /**
   * Set the options object in case a child wants to redefine it
   * @param options - the new options object
   */
  setOptions = (options) => (this.options = options);
}
