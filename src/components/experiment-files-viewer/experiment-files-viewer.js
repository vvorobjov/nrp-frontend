import React from 'react';
import { FaDownload, FaUpload, FaSearch, FaCheck } from 'react-icons/fa';

import ExperimentsFilesRemoteEditService from '../../services/experiments/files/experiments-files-remote-edit-service';

import './experiment-files-viewer.css';

export default class ExperimentFilesViewer extends React.Component {
  isChrome() {
    return !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
  }

  render() {
    return (
      <div className='experiment-files-viewer-wrapper'>
        {this.isChrome() ?
          <div>
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
          /* error notification for browser other than chrome */
          : <div>
            Feature is only supported on Chrome browser at the moment.
            <br />
            <a target='_blank' rel='noreferrer'
              href='https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API'>
              File System Access API
            </a>
            <br />
            <a target='_blank' rel='noreferrer' href='https://wicg.github.io/file-system-access/'>
              W3C Draft
            </a>
          </div>}
      </div>
    );
  }
}
