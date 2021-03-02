import React from 'react';
import { FaDownload, FaUpload, FaSearch } from 'react-icons/fa';

import ExperimentsFilesRemoteEditService from '../../services/experiments/files/experiments-files-remote-edit-service';
import ExperimentFilesTree from './experiment-files-tree';

import './experiment-files-viewer.css';

export default class ExperimentFilesViewer extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedExperiment: undefined
    };
  }

  render() {
    return (
      <div>
        {ExperimentsFilesRemoteEditService.instance.isSupported() ?
          <div className='experiment-files-viewer-wrapper'>
            <div className='grid-element local-directory-picker'>
              <div className='grid-element-header'>Local parent directory for experiment files</div>
              <div className='elements-local-directory'>
                <div className='local-directory-name'>
                  {ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle ?
                    <span>
                      {ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle.name}
                    </span>
                    : <span style={{color: 'gray'}}>Please choose</span>}
                </div>

                <button className='nrp-btn'
                  onClick={() => {
                    ExperimentsFilesRemoteEditService.instance.chooseLocalSyncDirectory();
                  }}
                  title='Choose sync directory'
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            <div className='grid-element experiment-list'>
              <div className='grid-element-header'>Experiments</div>
              <ol className='experiment-files-list'>
                {this.props.experiments.map(experiment => {
                  return (
                    <li key={experiment.id || experiment.configuration.id}
                      className={(this.state.selectedExperiment && this.state.selectedExperiment.id === experiment.id) ?
                        'experiments-li-selected' : ''}
                      onClick={() => {
                        this.setState({selectedExperiment: experiment});
                      }}>
                      {experiment.configuration.name}
                      <div className='experiment-li-buttons'>
                        <button className='nrp-btn'
                          disabled={!ExperimentsFilesRemoteEditService.instance.localSyncDirectoryHandle}
                          onClick={() => {
                            ExperimentsFilesRemoteEditService.instance.downloadExperimentToLocalFS(experiment);
                          }}
                          title='Download entire experiment to local filesystem'
                        >
                          <FaDownload />
                        </button>
                        <button className='nrp-btn'
                          disabled={!ExperimentsFilesRemoteEditService.instance.localSetups.has(experiment.id)}
                          onClick={() => {
                            ExperimentsFilesRemoteEditService.instance.uploadLocalFSExperimentToStorage(experiment);
                          }}
                          title='Upload entire experiment to server'
                        >
                          <FaUpload />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className='grid-element experiment-files'>
              <div className='grid-element-header'>Experiment Files</div>
              <ExperimentFilesTree experiment={this.state.selectedExperiment} />
            </div>
          </div>
          /* error notification for browser other than chrome */
          : <div>
            Feature API is not supported by this browser at the moment. Please try Chrome.
            <br />
            <a target='_blank' rel='noreferrer'
              href='https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API'>
              File System Access API
            </a>
            <br />
            <a target='_blank' rel='noreferrer' href='https://wicg.github.io/file-system-access/'>
              W3C Draft
            </a>
            <br />
            <a target='_blank' rel='noreferrer' href='https://caniuse.com/?search=file%20system%20access'>
              caniuse.com
            </a>
          </div>}
      </div>
    );
  }
}
