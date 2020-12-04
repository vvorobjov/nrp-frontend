import config from '../../config.json';
import endpoints from './data/endpoints.json';

import { HttpService } from '../http-service.js';

const USERGROUP_NAME_ADMINS = 'hbp-sp10-administrators';
const USERGROUP_NAME_CLUSTER_RESERVATION = 'hbp-sp10-cluster-reservation';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Service managing all data related to NRP users.
 */
class NrpUserService extends HttpService {
  constructor(enforcer) {
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use NrpUserService.instance');
    }

    super();

    this.PROXY_URL = config.api.proxy.url;
    this.IDENTITY_BASE_URL = `${this.PROXY_URL}${endpoints.proxy.identity.url}`;
    this.IDENTITY_ME_URL = `${this.PROXY_URL}${endpoints.proxy.identity.me.url}`;
    this.IDENTITY_ME_GROUPS_URL = `${this.PROXY_URL}${endpoints.proxy.identity.me.groups.url}`;
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
    return await this.httpRequestGET(this.IDENTITY_BASE_URL + '/' + userID);
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
  async getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = await this.httpRequestGET(this.IDENTITY_ME_URL);
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
      this.currentUserGroups = await this.httpRequestGET(
        this.IDENTITY_ME_GROUPS_URL
      );
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
}

export default NrpUserService;
