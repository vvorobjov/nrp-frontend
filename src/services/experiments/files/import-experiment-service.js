import { HttpProxyService } from '../../proxy/http-proxy-service';
import JSZip from 'jszip';

import endpoints from '../../proxy/data/endpoints.json';
import DialogService from '../../dialog-service.js';
const importExperimentURL = `${endpoints.proxy.storage.importExperiment.url}`;
const scanStorageURL = `${endpoints.proxy.storage.scanStorage.url}`;

/**
 * The Import Experiment Service performs the requests (Extract),
 * processes data such as zip or folder (Transform),
 * and passes them to the Import Experiment Component (Load).
 * Errors are handled by communicating with the Error Handler Service.
 */

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

/**
 * Non-default options (content type) for the POST request
 */
const options = {
  mode: 'cors', // no-cors, *cors, same-origin
  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  credentials: 'same-origin', // include, *same-origin, omit
  headers: {
    'Content-Type': 'application/octet-stream',
    Referer: 'http://localhost:9000/'
  },
  // redirect: manual, *follow, error
  redirect: 'follow',
  // referrerPolicy: no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin,
  // strict-origin, strict-origin-when-cross-origin, unsafe-url
  referrerPolicy: 'no-referrer',
  //body: JSON.stringify(data) // body data type must match "Content-Type" header
  method: 'POST'
};

export default class ImportExperimentService extends HttpProxyService {
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

  async getImportZipResponses(responses) {
    let importZipResponses = {
      zipBaseFolderName: [],
      destFolderName: [],
      newExpName: []
    };
    importZipResponses.numberOfZips = responses.length;
    await responses.forEach(async response =>{
      response = await response.json();
      importZipResponses['zipBaseFolderName'].push(response['zipBaseFolderName']);
      importZipResponses['destFolderName'].push(response['destFolderName']);
      importZipResponses['newExpName'].push(response['newName']);
    });
    return importZipResponses;
  }

  async getScanStorageResponse(response) {
    response = await response.json();
    let scanStorageResponse = {};
    ['deletedFolders', 'addedFolders'].forEach(name => {
      scanStorageResponse[`${name}Number`] = response[name].length;
      scanStorageResponse[name] = response[name].join(', ');
    });
    return scanStorageResponse;
  }

  async scanStorage() {
    return this.httpRequestPOST(scanStorageURL)
      .then(response => this.getScanStorageResponse(response))
      .catch(error => DialogService.instance.networkError(error));
  }

  async zipExperimentFolder(event) {
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
            DialogService.instance.dataError(error);
            return Promise.reject(error);
          })
      );
    });

    return Promise.all(promises)
      .then(() => zip.generateAsync({ type: 'blob' }))
      .catch(error => {
        DialogService.instance.dataError(error);
        return Promise.reject(error);
      });
  }

  async importExperimentFolder(event) {
    return this.zipExperimentFolder(event).then(async zipContent => {
      return this.httpRequestPOST(importExperimentURL, zipContent, options)
        .then(response => response.json())
        .catch(error => DialogService.instance.networkError(error)
        );
    });
  }

  readZippedExperiment(event) {
    let files = event.target.files;
    let zipFiles = [];
    Array.from(files).forEach(file => {
      zipFiles.push(file);
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
    let promises = this.readZippedExperiment(event)
      .then(zipContents =>
        zipContents.map(zipContent =>
          this.httpRequestPOST(importExperimentURL, zipContent, options)
            .catch(error => {
              DialogService.instance.networkError(error);
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