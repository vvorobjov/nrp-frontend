
import {EventEmitter} from 'events';

import AuthenticationService from './authentication-service.js';

/**
 * Base class that performs http requests with default request options.
 * If children need other options they can override the options or the
 * http verb (GET, POST, PUT etc) functions.
 */
export class HttpService extends EventEmitter {
  /**
   * Create a simple http request object with default options, default method is GET
   */
  constructor() {
    super();

    this.options = {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        Referer: 'http://localhost:9000/'
      },
      // redirect: manual, *follow, error
      redirect: 'follow',
      // referrerPolicy: no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin,
      // strict-origin, strict-origin-when-cross-origin, unsafe-url
      referrerPolicy: 'no-referrer'
      //body: JSON.stringify(data) // body data type must match "Content-Type" header
    };
  }

  /**
   * Perform a generic http request with options and url
   * @param url - the url to perform the request
   * @param options - the http options object
   */
  performRequest = async (url, options, data) => {
    // Add authorization header
    options.headers.Authorization = `Bearer ${AuthenticationService.instance.getStoredToken()}`;
    if (data) {
      console.info(options);
      options.body = data;
    }

    const response = await fetch(url, options);

    // error handling
    if (!response.ok) {
      if (response.status === 477) {
        const responseText = await response.text();
        AuthenticationService.instance.openAuthenticationPage(responseText);
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
  httpRequestGET = (url) => {
    // copy to avoid messing up the options object in case we need to reuse it
    const { ...getOptions } = this.options;
    return this.performRequest(url, getOptions);
  };

  /**
   * Perform a POST http request to a url
   * @param url - the url to perform the request
   */
  httpRequestPOST = (url, data) => {
    // copy to avoid messing up the options object in case we need to reuse it
    const { ...postOptions } = this.options;
    postOptions.method = 'POST';

    return this.performRequest(url, postOptions, data);
  };

  /**
   * Perform a PUT http request to a url
   * @param url - the url to perform the request
   */
  httpRequestPUT = async (url) => {
    // copy to avoid messing up the options object in case we need to reuse it
    const { ...putOptions } = this.options;
    putOptions.method = 'PUT';

    return this.performRequest(url, putOptions);
  };

  /**
   * Set the options object in case a child wants to redefine it
   * @param options - the new options object
   */
  setOptions = (options) => (this.options = options);
}
