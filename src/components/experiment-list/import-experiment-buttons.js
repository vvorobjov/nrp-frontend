import React from 'react';

import { FaFolder, FaFileArchive, FaAudible } from 'react-icons/fa';
import { ButtonGroup, Button } from 'react-bootstrap';

import ImportExperimentService from '../../services/experiments/storage/import-experiment-service.js';
import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';
import './experiment-list-element.css';
import './import-experiment-buttons.css';
export default class ImportExperimentButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
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

  importExperimentFolderChange(event) {
    this.setState({
      isImporting : true
    });
    ImportExperimentService.instance
      .importExperimentFolder(event)
      .then(async response => {
        this.setState({
          importFolderResponse : await response.json()
        });
        ExperimentStorageService.instance.getExperiments(true);
      })
      .finally(() => {
        this.setState({
          isImporting : false
        });
      });
  };

  importZippedExperimentChange(event) {
    this.setState({
      isImporting : true
    });
    ImportExperimentService.instance
      .importZippedExperiment(event)
      .then(async responses => {
        this.setState({
          importZipResponses : await responses
        });
        ExperimentStorageService.instance.getExperiments(true);
      })
      .finally(() => {
        this.setState({
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
      .then(async response => {
        this.setState({
          scanStorageResponse : await response
        });
        ExperimentStorageService.instance.getExperiments(true);
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
            <div variant="success">
              <p>The experiment folder
                <b>{' ' + this.state.importFolderResponse.zipBaseFolderName}</b> has been succesfully imported as
                <b>{' ' + this.state.importFolderResponse.destFolderName}</b>.
              </p>
            </div>
            <div className="text-right">
              <Button variant="success" onClick={() => this.importFolderPopupClick()}>Got it!</Button>
            </div>
          </div>
          : null
        }

        {/* Import zip pop-up */}
        {this.state.importZipResponses
          ? <div className="import-popup">
            <div>
              <p>{this.state.importZipResponses.numberOfZips} successfully imported zip files.</p>
            </div>
            <p>The following experiments folders</p>
            <p><b>{this.state.importZipResponses.zipBaseFolderName.join(', ')}</b></p>
            <p>have been successfully imported as:</p>
            <p><b>{this.state.importZipResponses.destFolderName.join(', ')}.</b></p>
            <div className="text-right">
              <Button variant="success" onClick={() => this.importZipPopupClick()}>Got it!</Button>
            </div>
          </div>
          : null
        }

        {/* Scan pop-up */}
        {this.state.scanStorageResponse
          ? <div className="import-popup">
            <div>
              <p>{this.state.scanStorageResponse.addedFoldersNumber} added folders,
                {' ' + this.state.scanStorageResponse.deletedFoldersNumber} deleted folders.</p>
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
              <Button variant="success" onClick={() => this.scanStoragePopupClick()}>Got it!</Button>
            </div>
          </div>
          : null
        }

        {/* Import buttons */}
        <div className="list-entry-buttons flex-container center">
          <input id="folder" type="file" style={{display:'none'}}
            multiple directory="" webkitdirectory=""
            onChange={(event) => this.importExperimentFolderChange(event)}/>
          <input id="zip" type="file" style={{display:'none'}}
            multiple webkitdirectory directory accept='.zip'
            onChange={(event) => this.importZippedExperimentChange(event)}/>
          {!this.state.isImporting
            ? <ButtonGroup role="group">
              <Button variant="outline-dark">
                <label for="folder"><FaFolder/> Import folder</label>
              </Button>
              <Button variant="outline-dark">
                <label for="zip"><FaFileArchive/> Import zip</label>
              </Button>
              <Button variant="outline-dark" onClick={() => this.scanStorageClick()}>
                <FaAudible/> Scan Storage
              </Button>
            </ButtonGroup>
            : null}
        </div>
      </div>
    );
  }
}