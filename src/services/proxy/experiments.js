import { options } from '../httpRequestOptions.js'
import endpoints from './data/endpoints.json'


class ExperimentsService {
    getExperiments = async token => {
        if (this.experiments) {
            return this.experiments;
        }
        const proxyEndpoint = endpoints.proxy;
        const experimentsUrl = `${proxyEndpoint.url}${proxyEndpoint.experiments.url}`;

        // Add authorization header
        options.headers.Authorization = `Bearer ${token}`;

        const response = await fetch(experimentsUrl, options);
        this.experiments = await response.json();
        return this.experiments;
    }
}


export default new ExperimentsService();
