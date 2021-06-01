import { HttpService } from '../http-service.js';

import endpoints from '../proxy/data/endpoints.json';
import config from '../../config.json';
import ErrorHandlerService from '../error-handler-service';

const storageModelsURL = `${config.api.proxy.url}${endpoints.proxy.models.url}`;
const allCustomModelsURL = `${config.api.proxy.url}${endpoints.proxy.storage.allCustomModels.url}`;
const userModelsURL = `${config.api.proxy.url}${endpoints.proxy.storage.userModels.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();
const availableModels = ['robots', 'brains', 'environments'];
/**
 * Service that manages the fetching and setting of custom and template
 * models from the proxy.
 */
class ModelsStorageService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ModelsStorageService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  /**
   * Retrieves the list of template or custom models from the proxy and stores
   * them in the models class property. If the models are already
   * there it just returns them, else does an HTTP request.
   *
   * @param {boolean} forceUpdate forces an update of the list
   * @param {string} modelType one of the types
   *                           ['robots', 'brains', 'environments']
   * @param {boolean} allCustomModels if true fetch custom(user) models intead of templates
   * @return models - the list of template models
   */
  async getTemplateModels(forceUpdate = false, modelType, allCustomModels = false) {
    if (!this.models || forceUpdate) {
      try {
        this.verifyModelType(modelType);
      }
      catch (error) {
        ErrorHandlerService.instance.dataError(error);
      }

      try {
        const modelsWithTypeURL = allCustomModels ?
          `${allCustomModelsURL}/${modelType}` :
          `${storageModelsURL}/${modelType}`;
        this.models = await (await this.httpRequestGET(modelsWithTypeURL)).json();
      }
      catch (error) {
        ErrorHandlerService.instance.networkError(error);
      }

    }

    return this.models;
  }

  /**
   * Retrieves the list of custom models per user from the storage
   *
   * @param {string} modelType one of the types
   *                           ['robots', 'brains', 'environments']
   * @return models - the list of custom user models
   */
  async getCustomModelsByUser(modelType) {
    try {
      this.verifyModelType(modelType);
      const customModelsURL = `${userModelsURL}/${modelType}`;
      return (await this.httpRequestGET(customModelsURL)).json();
    }
    catch (error) {
      ErrorHandlerService.instance.networkError(error);
    }
  }

  /**
   * Helper function that checks whether a specific type
   * of model is in the list of available models.
   *
   * @param {string} modelType one of the types
   *                           ['robots', 'brains', 'environments']
   */
  verifyModelType(modelType) {
    if (!availableModels.includes(modelType)) {
      throw new Error(
        `Error Type 400: Bad Request : The model type ${modelType}
        type that was requested is not one of brains, robots, environments.`);
    }
  }

  /**
    * Deletes a custom model from the storage
    *
    * @param {string} modelType one of the types
    *                           ['robots', 'brains', 'environments']
    * @param {string} modelName the name of the model to delete
    * @return the response of the request
    */

  async deleteCustomModel(modelType, modelName) {
    try {
      this.verifyModelType(modelType);
      const deleteCustomModelURL = `${userModelsURL}/${modelType}/${modelName}`;
      return (await this.httpRequestDELETE(deleteCustomModelURL)).json();
    }
    catch (error) {
      ErrorHandlerService.instance.dataError(error);
    }
  }

  /**
    * Sets a custom model to the storage
    *
    * @param {string} modelType one of the types
    *                           ['robots', 'brains', 'environments']
    * @param {string} modelName the name of the model to delete
    * @param fileContent the data of the model to upload
    * @return the response of the request
    */
  async setCustomModel(modelType, modelName, fileContent) {
    
    try {
      this.verifyModelType(modelType);
      const setCustomModelURL = `${storageModelsURL}/${modelType}/${modelName}`;
      return (await this.httpRequestPOST(setCustomModelURL, fileContent)).json();
    }
    catch (error) {
      ErrorHandlerService.instance.networkError(error);
    }
  }
}


export default ModelsStorageService;
