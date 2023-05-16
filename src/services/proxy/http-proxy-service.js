import { HttpService } from '../http-service.js';
import AuthenticationService from '../authentication-service';
import EventProxyService from './event-proxy-service';

const config = window.appConfig;

export class NRPProxyError extends Error {
  constructor(message, code, data) {
    super(message);
    this.data = data;
    this.code = code;
  }
}

/**
 * Class that performs http requests with default request options to proxy
 * and monitors proxy connectivity.
 * If children need other options they can override the options or the
 * http verb (GET, POST, PUT etc) functions.
 */
export class HttpProxyService extends HttpService {
  /**
   * Create a simple http request object with default options
   */
  constructor() {
    super();

    this.proxyURL = new URL(config.api.proxy.url);
    this.connected = true;
  }

  /**
   * Redefine the base HttpService generic http request
   * to send the requests to proxy.
   * The NRPProxyError is thrown if communication is failed
   * or the url is incorrect.
   *
   * @param url - proxy endpoint to perform the request
   * @param options - the http options object
   * @returns {Response} the response
   */
  performRequest = async (url, options, data) => {
    // check that url argument is an endpoint
    if(!url.startsWith('/')){
      throw new NRPProxyError(
        'Proxy requests are expected to start with forward slash (/)',
        url,
        JSON.stringify(options, null, 4)
      );
    }

    // Add authorization header
    await AuthenticationService.instance.promiseInitialized;
    let token = AuthenticationService.instance.getToken();
    options.headers.Authorization = 'Bearer ' + token;

    // add data to the request
    if (data) {
      options.body = data;
    }

    // construct the proper url path
    // append url to the proxy pathname
    const path = this.proxyURL.pathname + url;
    const requestURL = new URL(path, this.proxyURL);

    let response;

    try {
      // try to fetch the request
      response = await fetch(requestURL, options);
      // emit CONNECTED event, if needed
      EventProxyService.instance.emitConnected();
    }
    catch {
      // Throw NRPProxyError once
      EventProxyService.instance.emitDisconnected({
        code: requestURL.href,
        data: JSON.stringify(options, null, 4)
      });
      return new Response(JSON.stringify([]), {status: 404});
    }

    // error handling
    if (!response.ok) {
      if (response.status === 477) {
        AuthenticationService.instance.authenticate();
      }
      else if (response.status === 478) {
        //TODO: redirect to maintenance page
      }
    }
    return response;
  };

  /**
   * Returns the Proxy URL
   *
   * @returns {URL} object, representing the proxy URL
   */
  getProxyURL() {
    return this.proxyURL;
  }

  /**
   * Creates the url string for the proxy request
   *
   * @param {string} endpoint - request endpoint, i.e., /experiment/data
   * @param {object} search - request search parameters
   * @param {string} hash - request hash
   * @returns {string} the string, representing the proper proxy request url
   *
   * see https://developer.mozilla.org/en-US/docs/Web/API/URL as reference
   */
  createRequestURL(endpoint = '/', search, hash) {
    let url = new URL(endpoint, this.proxyURL);
    if (search) {
      for (const [key, value] of Object.entries(search)) {
        url.searchParams.set(key, value);
      }
    }
    if (hash) {
      url.hash = hash;
    }
    return url.pathname + url.search + url.hash;
  }
}

HttpProxyService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED'
});
