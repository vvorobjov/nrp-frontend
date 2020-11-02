import { options } from '../httpRequestOptions.js'
import endpoints from './data/endpoints.json'

const getExperiments = async token => {
    const proxyEndpoint = endpoints.proxy;
    const experimentsUrl = `${proxyEndpoint.url}${proxyEndpoint.experiments.url}`;

    // Add authorization header
    options.headers.Authorization = `Bearer ${token}`;

    const response = await fetch(experimentsUrl, options);
    return await response.json();
}

export { getExperiments };
