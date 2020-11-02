/**
* Base class that performs http requests with default request options.
* If children need other options they can override the options or the 
* http verb (GET, POST, PUT etc) functions.
*/
export class HttpService {
    /**
    * Create a simple http request object with default options, default method is GET
    */
    constructor() {
        this.options = {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            //body: JSON.stringify(data) // body data type must match "Content-Type" header
        };
    }

    //TODO remove token when the authentication class is there
    /**
    * Perform a generic http request with options and url
    * @param url - the url to perform the request
    * @param options - the http options object
    */
    performRequest = async (url, options, token) => {
        // Add authorization header
        options.headers.Authorization = `Bearer ${token}`;
        const response = await fetch(url, options);
        return await response.json();
    }

    /**
    * Perform a GET http request to a url
    * @param url - the url to perform the request
    */
    httpRequestGET = (url, token) => {
        // copy to avoid messing up the options object in case we need to reuse it
        const { ...getOptions } = this.options;
        return this.performRequest(url, getOptions, token);
    }

    /**
    * Perform a POST http request to a url
    * @param url - the url to perform the request
    */
   httpRequestPOST = (url, token) => {
        // copy to avoid messing up the options object in case we need to reuse it
        const { ...postOptions } = this.options;
        postOptions.method = 'POST';

        return this.performRequest(url, postOptions, token);
    }

    /**
    * Perform a PUT http request to a url
    * @param url - the url to perform the request
    */
   httpRequestPUT = async (url, token) => {
        // copy to avoid messing up the options object in case we need to reuse it
        const { ...putOptions } = this.options;
        putOptions.method = 'PUT';

        return this.performRequest(url, putOptions, token);
    }

    /**
    * Set the options object in case a child wants to redefine it
    * @param options - the new options object
    */
    setOptions = options => this.options = options;
};