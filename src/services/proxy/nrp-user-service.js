import endpoints from './data/endpoints.json';

import { HttpProxyService } from '../proxy/http-proxy-service';

const USERGROUP_NAME_ADMINS = 'hbp-sp10-administrators';
const USERGROUP_NAME_CLUSTER_RESERVATION = 'hbp-sp10-cluster-reservation';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();


const IDENTITY_BASE_URL = `${endpoints.proxy.identity.url}`;
const IDENTITY_ME_URL = `${endpoints.proxy.identity.me.url}`;
const IDENTITY_ME_GROUPS_URL = `${endpoints.proxy.identity.me.groups.url}`;
const GDPR_URL = `${IDENTITY_BASE_URL}${endpoints.proxy.identity.gdpr.url}`;
/**
 * Service managing all data related to NRP users.
 */
class NrpUserService extends HttpProxyService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
    this.currentUser = null;
  }

  static get instance() {
    if (_instance == null) {
      _instance = new NrpUserService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Get all user information for a given ID.
   * @param {string} userID - the ID of the user
   * @returns {promise} Request for the user
   */
  async getUser(userID) {
    return await (await this.httpRequestGET(IDENTITY_BASE_URL + '/' + userID)).json();
  }

  /**
   * Checks if the user is set
   * @returns {bool} The presence of the logged in user
   */
  userIsSet() {
    return this.currentUser !== null;
  }

  /**
   * Get the name displayed for a user ID.
   * @param {string} userID - the ID of the user
   * @returns {string} user name, or unknown
   */
  async getUserName(userID) {
    return await this.getUser(userID)
      .then(({ displayName }) => displayName)
      .catch(() => 'Unknown');
  }

  /**
   * Gives you the user currently logged in.
   *
   * @return currentUser - the user currently logged in
   */
  async getCurrentUser(force = false) {
    if (force || !this.currentUser) {
      await this.httpRequestGET(IDENTITY_ME_URL).then(async (identity) => {
        if (identity.ok){
          this.currentUser = await identity.json();
          this.emit(NrpUserService.EVENTS.CONNECTED);
        }
        else {
          // TODO: emit some event? error?
          this.currentUser = null;
        }
      }).catch(() => {
        this.currentUser = null;
        this.emit(NrpUserService.EVENTS.DISCONNECTED);
      });
    }
    return this.currentUser;
  }

  /**
   * Gives you the currently defined user groups.
   *
   * @return currentUserGroups - the user groups currently belonging to
   */
  async getCurrentUserGroups() {
    if (!this.currentUserGroups) {
      let response = await this.httpRequestGET(IDENTITY_ME_GROUPS_URL);
      this.currentUserGroups = response.json();
    }

    return this.currentUserGroups;
  }

  /**
   * Checks whether the current user is part of a specified group.
   * @param {string} groupName - the name of the group to check
   * @returns {boolean} Whether the user is part of the group.
   */
  async isGroupMember(groupName) {
    return await this.getCurrentUserGroups().then((groups) =>
      groups.some((g) => g.name === groupName));
  }

  /**
   * Checks if the user is part of the cluster reservation group.
   */
  async isMemberOfClusterReservationGroup() {
    return await this.isGroupMember(USERGROUP_NAME_CLUSTER_RESERVATION);
  }

  /**
   * Checks if the user is part of the administrator group.
   */
  async isAdministrator() {
    return await this.isGroupMember(USERGROUP_NAME_ADMINS);
  }

  /**
   * Retrieve cluster reservations from the session storage.
   * @returns {object} Cluster reservation
   */
  getReservation() {
    return window.sessionStorage.getItem('clusterReservation');
  }

  /**
   * Get the GDPR status for current user.
   * @returns {promise} Contains the GDPR status for the current user
   */
  async getGdpr() {
    return await (await this.httpRequestGET(GDPR_URL)).json();
  }

  /**
   * Set the accepted GDPR status for current user.
   * @returns {promise} Response for the current user
   */
  async setGdpr() {
    return await (await this.httpRequestPOST(GDPR_URL)).json();
  }
}

NrpUserService.EVENTS = Object.freeze({
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED'
});

export default NrpUserService;
