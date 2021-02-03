import { HttpService } from '../../http-service.js';
import ErrorHandlerService from '../../error-handler-service.js';
import JSZip from 'jszip';

import endpoints from '../../proxy/data/endpoints.json';
import config from '../../../config.json';
const importExperimentURL = `${config.api.proxy.url}${endpoints.proxy.storage.importExperiment.url}`;
const scanStorageURL = `${config.api.proxy.url}${endpoints.proxy.storage.scanStorage.url}`;

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

export default class ImportExperimentService extends HttpService {
  constructor(enforcer) {
    super();
    if (enforcer !== SINGLETON_ENFORCER) {
      throw new Error('Use ' + this.constructor.name + '.instance');
    }
  }

  static get instance() {
    if (_instance == null) {
      _instance = new ImportExperimentService(SINGLETON_ENFORCER);
    }

    return _instance;
  }

  getImportZipResponses(responses) {
    let importZipResponses = {};
    importZipResponses.numberOfZips = responses.length;
    ['zipBaseFolderName', 'destFolderName'].forEach(name => {
      importZipResponses[name] = responses
        .map(response => response[name])
        .join(', ');
    });
    return importZipResponses;
  }

  getScanStorageResponse(response) {
    let scanStorageResponse = {};
    ['deletedFolders', 'addedFolders'].forEach(name => {
      scanStorageResponse[`${name}Number`] = response[name].length;
      scanStorageResponse[name] = response[name].join(', ');
    });
    return scanStorageResponse;
  }

  scanStorage() {
    return this.httpRequestPOST(scanStorageURL)
      .then(this.getScanStorageResponse)
      .catch(ErrorHandlerService.instance.displayError({
        type: 'Import Error.'
      }));
  }

  zipExperimentFolder(event) {
    let zip = new JSZip();
    let files = event.target.files;
    if (files.length === 0){
      return; // The folder upload was aborted by user
    }
    let promises = [];
    Array.from(files).forEach(file => {
      promises.push(
        new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onerror = error => {
            reader.abort();
            return reject(error);
          };
          reader.onload = f =>
            resolve([file.webkitRelativePath, f.target.result]);
          if (
            file.type.startsWith('image') ||
            file.type === 'application/zip' ||
            file.webkitRelativePath.split('.').pop() === 'h5'
          ) {
            reader.readAsArrayBuffer(file);
          }
          else {
            reader.readAsText(file);
          }
        })
          .then(([filepath, filecontent]) =>
            Promise.resolve(
              zip.file(filepath, filecontent, { createFolders: true })
            )
          )
          .catch(error => {
            ErrorHandlerService.instance.displayError(error);
            return Promise.reject(error);
          })
      );
    });

    return Promise.all(promises)
      .then(() => zip.generateAsync({ type: 'blob' }))
      .catch(error => {
        ErrorHandlerService.instance.displayError(error);
        return Promise.reject(error);
      });
  }

  importExperimentFolder(event) {
    return this.zipExperimentFolder(event).then(zipContent => {
      return this.httpRequestPOST(importExperimentURL, zipContent)
        .catch(ErrorHandlerService.instance
          .displayError({
            type: 'Import Error.'
          })
        );
    });
  }

  readZippedExperimentExperiment(event) {
    let files = event.target.files;
    let zipFiles = [];
    Array.from(files).forEach(file => {
      if (file.type !== 'application/zip') {
        ErrorHandlerService.instance.displayError({
          type: 'Import Error.',
          message:`The file ${file.name} cannot be imported because it is not a zip file.`
        });
      }
      else {
        zipFiles.push(file);
      }
    });
    let promises = zipFiles.map(zipFile => {
      return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = f => resolve(f.target.result);
        reader.readAsArrayBuffer(zipFile);
      });
    });
    return Promise.all(promises);
  }

  importZippedExperiment(event) {
    let promises = this.readZippedExperimentExperiment(event)
      .then(zipContents =>
        zipContents.map(zipContent =>
          this.httpRequestPOST(importExperimentURL, zipContent).catch(error => {
            ErrorHandlerService.instance.displayError(error);
            return Promise.reject(error);
          })
        )
      )
      .then(responses =>
        Promise
          .all(responses)
          .then(responses => this.getImportZipResponses(responses))
      );
    return promises;
  }

}