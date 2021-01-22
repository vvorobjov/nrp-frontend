import JSZip from 'jszip';

import ExperimentStorageService from './experiment-storage-service.js';
import { HttpService } from '../../http-service.js';
import ErrorHandlingService from '../../error-handler-service.js';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

class ImportExperimentService extends HttpService {
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

  createImportErrorPopup(error) {
    ErrorHandlingService.instance.displayError({
      type: 'Import Error.',
      message: error.data
    });
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
    return ExperimentStorageService.instance
      .scanStorage()
      .then(this.getScanStorageResponse)
      .catch(this.createImportPopupError);
  }

  zipExperimentFolder(e) {
    let zip = new JSZip();
    let files = e.target.files;
    if (files.length === 0){
      return; // The folder upload was aborted by user
    }
    let promises = [];
    Array.from(files).forEach(file => {
      promises.push(
        new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onerror = err => {
            reader.abort();
            return reject(err);
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
          .catch(err => {
            this.createImportErrorPopup(err);
            return Promise.reject(err);
          })
      );
    });

    return Promise
      .all(promises)
      .then(() => zip.generateAsync({ type: 'blob' }))
      .catch(err => {
        this.createImportErrorPopup(err);
        return Promise.reject(err);
      });
  }

  importExperimentFolder(e) {
    return this.zipExperimentFolder(e).then(zipContent => {
      return ExperimentStorageService.instance
        .importExperiment(zipContent)
        .catch(this.createImportErrorPopup);
    });
  }

  readZippedExperimentExperiment(e) {
    let files = e.target.files;
    let zipFiles = [];
    Array.from(files).forEach(file => {
      if (file.type !== 'application/zip') {
        this.createImportErrorPopup(
          `The file ${file.name} cannot be imported because it is not a zip file.`
        );
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

  importZippedExperiment(e) {
    let promises = this.readZippedExperimentExperiment(e)
      .then(zipContents =>
        zipContents.map(zipContent =>
          ExperimentStorageService.instance.importExperiment(zipContent).catch(err => {
            this.createImportErrorPopup(err);
            return Promise.reject();
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

export default ImportExperimentService;