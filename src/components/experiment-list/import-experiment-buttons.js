import React from 'react';

import { FaFolder, FaFileArchive, FaAudible } from 'react-icons/fa';

import ImportExperimentService from '../../services/experiments/files/import-experiment-service.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';
import './experiment-list-element.css';
import './import-experiment-buttons.css';


import frontendConfig from '../../config.json';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
export default class ImportExperimentButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    // By default, we enable the scan storage button, even if it's not in the config.
    // For the online version, we explicitly disable it.
    this.scanStorage = frontendConfig.scanStorage !== undefined ? frontendConfig.scanStorage : true;
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
          importFolderResponse : await response
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
          ? <div className='import-popup'>
            <div className='alert alert-success' role='alert'>
              <p>The experiment folder
                <b>{' ' + this.state.importFolderResponse.zipBaseFolderName}</b> has been succesfully imported as
                <b>{' ' + this.state.importFolderResponse.destFolderName}</b>.
              </p>
            </div>
            <div className='text-right'>
              <button className='btn btn-success' onClick={() => this.importFolderPopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Import zip pop-up */}
        {this.state.importZipResponses
          ? <div className='import-popup'>
            <div className='alert alert-success' role='alert'>
              <p>{this.state.importZipResponses.numberOfZips} successfully imported zip files.</p>
            </div>
            <p>The following experiments folders</p>
            <p><b>{this.state.importZipResponses.zipBaseFolderName.join(', ')}</b></p>
            <p>have been successfully imported as:</p>
            <p><b>{this.state.importZipResponses.destFolderName.join(', ')}.</b></p>
            <div className='text-right'>
              <button className='btn btn-success' onClick={() => this.importZipPopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Scan pop-up */}
        {this.state.scanStorageResponse
          ? <div className='import-popup'>
            <div className='alert alert-success' role='alert'>
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
            <div className='text-right'>
              <button className='btn btn-success' onClick={() => this.scanStoragePopupClick()}>Got it!</button>
            </div>
          </div>
          : null
        }

        {/* Import buttons */}
        {/* TODO: [NRRPLT-8721] restore experiment import funtionality */}
        <div className='list-entry-buttons flex-container center'>
          <input disabled={true} id='folder' type='file' style={{ display: 'none' }}
            multiple directory='' webkitdirectory=''
            onChange={(event) => this.importExperimentFolderChange(event)} />
          <input disabled={true} id='zip' type='file' style={{ display: 'none' }}
            multiple accept='.zip'
            onChange={(event) => this.importZippedExperimentChange(event)} />
          <div className='btn-group' role='group'>
            <OverlayTrigger placement='bottom'
              key='folder-tooltip'
              overlay={
                <Tooltip id='tooltip-folder'>
                  The import of the experiments is coming soon!
                </Tooltip>
              }
            >
              <button type='button' className='btn btn-outline-dark'>
                <label htmlFor='folder' className='import-button'>
                  <FaFolder /> Import folder
                </label>
              </button>
            </OverlayTrigger>
            <OverlayTrigger placement='bottom'
              key='zip-tooltip'
              overlay={
                <Tooltip id='tooltip-zip'>
                  The import of the zipped experiments is coming soon!
                </Tooltip>
              }
            >
              <button type='button' className='btn btn-outline-dark'
                data-toggle='tooltip' data-placement='bottom' title='Tooltip on bottom'
              >
                <label htmlFor='zip' className='import-button'><FaFileArchive /> Import zip</label>
              </button >
            </OverlayTrigger>

            {
              this.scanStorage ?
                <button type='button' className='btn btn-outline-dark' onClick={() => this.scanStorageClick()}>
                  <FaAudible /> Scan Storage
                </button> :
                null
            }
          </div>
        </div>
      </div>
    );
  }
}