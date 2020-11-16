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
        this.IDENTITY_ME_GROUPS_URL = `${this.PROXY_URL}${endpoints.proxy.identity.me.groups.url}`;
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

    /**
     * Gives you the currently defined user groups (not the groups the current user belongs to)
     * 
     * @return currentUserGroups - the user groups currently defined
     */
    getCurrentUserGroups() {
        if (!this.currentUserGroups) {
            this.currentUserGroups = this.httpRequestGET(this.IDENTITY_ME_GROUPS_URL);
        }

        return this.currentUserGroups;
    } 

    getReservation() {
        window.sessionStorage.getItem('clusterReservation');
    }


    isGroupMember(group) {
        this.getCurrentUserGroups().then(groups =>
            groups.some(g => g.name === group)
        );
    }


    getOwnerName(userId) {
        /*storageServer
            .getUser(userId)
        .then(({ displayName }) => displayName)
        .catch(() => 'Unkwown');*/
    }


    getCurrentUserInfo() {
        /*$q.all([this.getCurrentUser()]).then(([{ id }]) => ({
            userID: id
        }));*/
    }

}


export default new NrpUserService();
