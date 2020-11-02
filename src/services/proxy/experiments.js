import endpoints from './data/endpoints.json'
import { httpRequest } from '../httpService.js';
import config from '../../config.json'

/**
* Service that fetches the template experiments list from the proxy given
* that the user has authenticated successfully.
*/
class ExperimentsService extends httpRequest {

    /**
    * Retrieves the list of template experiments from the proxy and stores 
    * them in the experiments class property. If the experiments are already
    * there it just returns them, else does an HTTP request. 
    * @return {experiments} the list of template experiments
    */
    //TODO remove token when the authentication class is there
    getExperiments = async token => {
        if (this.experiments) {
            return this.experiments;
        }
        const proxyEndpoint = endpoints.proxy;
        const experimentsUrl = `${config.api.proxy.url}${proxyEndpoint.experiments.url}`;
        this.experiments = await this.get(experimentsUrl, token);
        return this.experiments;
    }
}


export default new ExperimentsService();
