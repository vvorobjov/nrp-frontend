import React from 'react';
import { FaDownload, FaUpload, FaSearch, FaCheck } from 'react-icons/fa';

import ExperimentsFilesRemoteEditService from '../../services/experiments/files/experiments-files-remote-edit-service';

import './experiment-files-viewer.css';

export default class ExperimentFilesViewer extends React.Component {
  render() {
    return (
      <div className='experiment-files-viewer-wrapper'>
        <div className='sync-dir-picker'>
          Choose local directory for experiment synchronization
          <button
            onClick={() => {
              ExperimentsFilesRemoteEditService.instance.chooseLocalSyncDirectory();
            }}
            title='Choose sync directory'
          >
            <FaSearch />
          </button>
          {ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle ?
            <div>
              <FaCheck />
              {ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle.name}
            </div>
            : null}
        </div>
        <div className='experiment-list'>
          Experiments
          <ol>
            {this.props.experiments.map(experiment => {
              return (
                <li key={experiment.id || experiment.configuration.id} className='nostyle'>
                  {experiment.configuration.name}
                  <button
                    disabled={!ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle}
                    onClick={() => {
                      ExperimentsFilesRemoteEditService.instance.downloadExperimentToLocalFS(experiment);
                    }}
                    title='Clone to local filesystem'
                  >
                    <FaDownload />
                  </button>
                  <button
                    disabled={!ExperimentsFilesRemoteEditService.instance.localSetups.has(experiment.id)}
                    onClick={() => {
                      ExperimentsFilesRemoteEditService.instance.uploadLocalFSExperimentToStorage(experiment);
                    }}
                    title='Clone to local filesystem'
                  >
                    <FaUpload />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className='experiment-files'></div>
      </div>
    );
  }
}
