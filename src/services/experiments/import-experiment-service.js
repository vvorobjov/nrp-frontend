import React from 'react';
import JSZip from 'jszip';

let _instance = null;
const SINGLETON_ENFORCER = Symbol();

export default class ImportExperimentService extends React.Component {
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
    this.nrpErrorDialog.open({
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
    return this.storageServer
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
        this.$q((resolve, reject) => {
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
            this.$q.resolve(
              zip.file(filepath, filecontent, { createFolders: true })
            )
          )
          .catch(err => {
            this.createImportErrorPopup(err);
            return this.$q.reject(err);
          })
      );
    });

    return this.$q
      .all(promises)
      .then(() => zip.generateAsync({ type: 'blob' }))
      .catch(err => {
        this.createImportErrorPopup(err);
        return this.$q.reject(err);
      });
  }

  importExperimentFolder(e) {
    return this.zipExperimentFolder(e).then(zipContent => {
      return this.storageServer
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
      return this.$q(resolve => {
        let reader = new FileReader();
        reader.onload = f => resolve(f.target.result);
        reader.readAsArrayBuffer(zipFile);
      });
    });
    return this.$q.all(promises);
  }

  importZippedExperiment(e) {
    let promises = this.readZippedExperimentExperiment(e)
      .then(zipContents =>
        zipContents.map(zipContent =>
          this.storageServer.importExperiment(zipContent).catch(err => {
            this.createImportErrorPopup(err);
            return this.$q.reject();
          })
        )
      )
      .then(responses =>
        this.$q
          .all(responses)
          .then(responses => this.getImportZipResponses(responses))
      );
    return promises;
  }

}