import config from '../../config.json';
import endpoints from './data/endpoints.json';

import { HttpService } from '../http-service.js';

/**
* Service managing all data related to NRP users.
*/
class NrpUserService extends HttpService {
    constructor() {
        super();

        this.PROXY_URL = config.api.proxy.url;
        this.IDENTITY_ME_URL = `${this.PROXY_URL}${endpoints.proxy.identity.me.url}`;
        console.info('NrpUserService IDENTITY_ME_URL: ' + this.IDENTITY_ME_URL);
    }

    /**
     * Gives you the user currently logged in.
     * 
     * @return currentUser - the user currently logged in
     */
    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = this.httpRequestGET(this.IDENTITY_ME_URL);
        }

        return this.currentUser;
    }
}


export default new NrpUserService();
