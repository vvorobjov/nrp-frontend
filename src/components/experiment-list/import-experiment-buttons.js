import React from 'react'

import './experiment-list-element.css';

export default class ImportExperimentButtons extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render () {
        return (
            <div>
                {/* Import folder pop-up */}
                {this.state.importFolderResponse
                ? <div className="import-popup">
                    <div className="alert alert-success" role="alert">
                        <p>The experiment folder <b>{importFolderResponse.zipBaseFolderName}</b> has been succesfully imported as 
                            <b>{importFolderResponse.destFolderName}</b>.
                        </p>
                        </div>
                    <div className="text-right">
                        <button className="btn btn-success" onClick={() => this.importFolderPopupClick()}>Got it!</button>
                    </div>
                </div>
                : null}

                {/* Import zip pop-up */}
                {this.state.importZipResponses
                ? <div className="import-popup">
                    <div className="alert alert-success" role="alert">
                        <p>{importZipResponses.numberOfZips} successfully imported zip files.</p>
                    </div>
                <p>The following experiments folders</p> 
                <p><b>{importZipResponses.zipBaseFolderName}</b></p> 
                <p>have been successfully imported as:</p>
                <p><b>{importZipResponses.destFolderName}.</b></p>
                    <div className="text-right">
                        <button className="btn btn-success" onClick={() => importZipPopupClick()}>Got it!</button>
                    </div>
                </div>
                : null}

                {/* Scan pop-up */}
                {this.state.scanStorageResponse
                ? <div className="import-popup">
                <div className="alert alert-success" role="alert">
                    <p>{scanStorageResponse.addedFoldersNumber} added folders, {scanStorageResponse.deletedFoldersNumber} deleted folders.</p>
                </div>
                <p>Added:</p>
                <p><b>{scanStorageResponse.addedFolders !== '' ? scanStorageResponse.addedFolders : 'none' }</b></p> 
                <p>Deleted:</p>
                <p><b>{scanStorageResponse.deletedFolders !== '' ? scanStorageResponse.deletedFolders : 'none' }</b></p>
                    <div className="text-right">
                        <button className="btn btn-success" onClick={() => scanStoragePopupClick()}>Got it!</button>
                    </div>
                </div>
                : null}

                {/* Import buttons */}
                {this.state.isPrivateExperiment && private && !running
                ? <div className="list-entry-container left-right">
                    <input type="file" multiple id="import-experiment-folder-input" webkitdirectory directory/>
                    <input type="file" multiple id="import-zip-experiment-input" accept="application/zip"/>
                    <div className="list-entry-left" style="position:relative">
                        <img className="entity-thumbnail" ng-src="img/esv/import-icon.png" className="{selected: false}" />
                    </div>
                    <div className="list-entry-middle list-entry-container up-down" id="import-buttons">
                        <div ng-show="!running" className="list-entry-buttons list-entry-container center">
                            <div className="btn-group" role="group" ng-disabled="isImporting">
                                <button className="btn btn-default" onClick={() => importExperimentFolderClick()}> <i className="fa fa-folder"></i> Import folder
                                </button>
                                <button className="btn btn-default" onClick={() => importZippedExperimentClick()}> <i className="fa fa-file-archive"></i> Import zip
                                </button>
                                <button ng-if="isLocalUser" className="btn btn-default" onClick={() => scanStorageClick()}> <i className="fab fa-audible"></i> Scan Storage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                : null}
                {this.state.isPrivateExperiment && private && !running
                ? <hr className="list-separator"/>
                : null}
            </div>
        );
    }
}