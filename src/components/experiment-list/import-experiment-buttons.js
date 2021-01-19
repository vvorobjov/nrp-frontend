import React from 'react';

import ImportExperimentService from '../../services/experiments/import-experiment-service.js';

import './experiment-list-element.css';


export default class ImportExperimentButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isImporting: false
    };
  }

  importFolderPopupClick() {
    this.setState({
      importFolderResponse : undefined
    });
  }

  importZipPopupClick() {
    this.setState({
      importZipResponses : undefined
    });
  }

  scanStoragePopupClick() {
    this.setState({
      scanStorageResponse : undefined
    });
  }

  importExperimentFolderClick(e) {
    this.setState({
      isImporting : true
    });
    ImportExperimentService.instance
      .importExperimentFolder(e)
      .then(response => {
        this.setState({
          importFolderResponse : response
        });
        this.loadExperiments(true);

        // Allows to re-import the same zip file
        let items = [...this.state.importExperimentFolderInput];
        let item = {...items[0]};
        item.value = '';
        items[0] = item;

        this.setState({
          importExperimentFolderInput: items,
          isImporting : false
        });
      });
  };

  importZippedExperimentClick(e) {
    this.setState({
      isImporting : true
    });
    ImportExperimentService.instance
      .importZippedExperiment(e)
      .then(responses => {
        this.setState({
          importZipResponses : responses
        });
        this.loadExperiments(true);
        const lastImportedExperiment = responses.destFolderName
          .split(',')
          .pop()
          .trim();
        this.selectExperiment({ id: lastImportedExperiment });
      })
      .finally(() => {
        // Allows to re-import the same zip file
        let items = [...this.state.importExperimentFolderInput];
        let item = {...items[0]};
        item.value = '';
        items[0] = item;

        this.setState({
          importZippedExperimentInput: items,
          isImporting : false
        });
      });
  };

  scanStorageClick() {
    this.setState({
      isImporting : true
    });
    ImportExperimentService.instance
      .scanStorage()
      .then(response => {
        this.setState({
          scanStorageResponse : response
        });
        this.loadExperiments(true);
        const lastImportedExperiment = response.addedFolders
          .split(',')
          .pop()
          .trim();
        this.selectExperiment({ id: lastImportedExperiment });
      })
      .finally(() => {
        this.setState({
          isImporting : false
        });
      });
  }

  render() {
    return (
      <div>
        {/* Import folder pop-up */}
        {this.state.importFolderResponse
          ? <div className="import-popup">
            <div className="alert alert-success" role="alert">
              <p>The experiment folder
                <b>{this.state.importFolderResponse.zipBaseFolderName}</b> has been succesfully imported as
                <b>{this.state.importFolderResponse.destFolderName}</b>.
              </p>
            </div>
            <div className="text-right">
              <button className="btn btn-success" onClick={() => this.importFolderPopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Import zip pop-up */}
        {this.state.importZipResponses
          ? <div className="import-popup">
            <div className="alert alert-success" role="alert">
              <p>{this.state.importZipResponses.numberOfZips} successfully imported zip files.</p>
            </div>
            <p>The following experiments folders</p>
            <p><b>{this.state.importZipResponses.zipBaseFolderName}</b></p>
            <p>have been successfully imported as:</p>
            <p><b>{this.state.importZipResponses.destFolderName}.</b></p>
            <div className="text-right">
              <button className="btn btn-success" onClick={() => this.importZipPopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Scan pop-up */}
        {this.state.scanStorageResponse
          ? <div className="import-popup">
            <div className="alert alert-success" role="alert">
              <p>{this.state.scanStorageResponse.addedFoldersNumber} added folders,
                {this.state.scanStorageResponse.deletedFoldersNumber} deleted folders.</p>
            </div>
            <p>Added:</p>
            <p><b>{this.state.scanStorageResponse.addedFolders !== ''
              ? this.state.scanStorageResponse.addedFolders
              : 'none' }
            </b></p>
            <p>Deleted:</p>
            <p><b>{this.state.scanStorageResponse.deletedFolders !== ''
              ? this.state.scanStorageResponse.deletedFolders
              : 'none' }</b></p>
            <div className="text-right">
              <button className="btn btn-success" onClick={() => this.scanStoragePopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Import buttons */}
        <div className="list-entry-container left-right">
          <input type="file" multiple id="import-experiment-folder-input" webkitdirectory directory/>
          <input type="file" multiple id="import-zip-experiment-input" accept="application/zip"/>
          <div className="list-entry-left" style={{position:'relative'}}>
            <img className="entity-thumbnail" src="img/esv/import-icon.png" alt='' style={{selected: 'false'}} />
          </div>
          <div className="list-entry-middle list-entry-container up-down" id="import-buttons">
            <div ng-show="!running" className="list-entry-buttons list-entry-container center">
              <div className="btn-group" role="group" ng-disabled="isImporting">
                <button className={this.state.importExperimentFolderActive
                  ? 'import-experiment-folder-input btn btn-default'
                  : 'btn btn-default'}
                onClick={(e) => this.importExperimentFolderClick(e)}> <i className="fa fa-folder"></i> Import folder
                </button>
                <button claasName={this.state.importZippedExperimentActive
                  ? 'import-zip-experiment-input btn btn-default'
                  : 'btn btn-default'}
                onClick={(e) => this.importZippedExperimentClick(e)}>
                  <i className="fa fa-file-archive"></i> Import zip
                </button>
                <button className="btn btn-default" onClick={() => this.scanStorageClick()}>
                  <i className="fab fa-audible"></i> Scan Storage
                </button>
              </div>
            </div>
          </div>
        </div>
        <hr className="list-separator"/>
      </div>
    );
  }
}