import React from 'react';
import { FaDownload, FaUpload, FaFolderOpen } from 'react-icons/fa';
import { IoSyncCircleOutline, IoSyncCircleSharp } from 'react-icons/io5';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import RemoteExperimentFilesService from '../../services/experiments/files/remote-experiment-files-service';
//import ExperimentFilesTree from './experiment-files-tree';

import './experiment-files-viewer.css';

export default class ExperimentFilesViewer extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedExperiment: undefined,
      selectedFilepaths: undefined,
      selectedFile: undefined
    };
  }

  /**
   * Handles select events on the file tree.
   * @param {Event} event - select event
   * @param {Array} nodeIds - tree node IDs, in this case we use file relative paths (= server file UUID)
   */
  handleFileTreeSelect(event, nodeIds) {
    this.setState({selectedFilepaths: nodeIds});
    if (nodeIds.length === 1) {
      let file = RemoteExperimentFilesService.instance.localFiles.get(nodeIds[0]);
      this.setState({selectedFile: file});
    }
    else {
      this.setState({selectedFile: undefined});
    }
  }

  /**
   * JSX for the file hierarchie of experiments.
   * @param {Object} file - A file/folder with children to be displayed
   * @returns {JSX} The JSX elements
   */
  renderFileTree(file) {
    let className = '';
    if (file.hasLocalChanges) {
      className += ' file-local-changes';
    }
    if (file.isOutOfSync) {
      className += ' file-dirty';
    }
    if (file.untracked) {
      className += ' file-untracked';
    }
    className = className.trim();

    return (
      <TreeItem key={file.relativePath} nodeId={file.relativePath} label={file.fileSystemHandle.name}
        className={className}>
        {Array.isArray(file.children) ? file.children.map((subfile) => this.renderFileTree(subfile)) : null}
      </TreeItem>);
  }

  getExperimentsListItemClass(experiment) {
    let className = '';
    if (this.state.selectedExperiment && this.state.selectedExperiment.id === experiment.id) {
      className += ' experiments-li-selected';
    }
    if (!RemoteExperimentFilesService.instance.localFiles.has(experiment.id)) {
      className += ' experiments-li-disabled';
    }

    return className.trim();
  }

  render() {
    let selectedExperimentFiles = this.state.selectedExperiment ?
      RemoteExperimentFilesService.instance.localFiles.get(this.state.selectedExperiment.id) : undefined;

    return (
      <div>
        {RemoteExperimentFilesService.instance.isSupported() ?
          <div className='experiment-files-viewer-wrapper'>
            {/* choose the local parent directory for experiment files */}
            <div className='grid-element local-directory-picker'>
              <div className='grid-element-header'>
                <div>Local working directory</div>
                <button className='nrp-btn'
                  onClick={() => {
                    RemoteExperimentFilesService.instance.chooseLocalSyncDirectory();
                  }}
                  title='This is your local directory to work in. All your experiment files will go here.
                  Usually, you would want to always pick the same folder.
                  If you have previously chosen a different folder, any changes made there will not be listed.'
                >
                  <FaFolderOpen />
                </button>
              </div>

              <div className='elements-local-directory'>
                <div></div>
                <div className='local-directory-name'>
                  {RemoteExperimentFilesService.instance.localSyncDirectoryHandle ?
                    <span>
                      {RemoteExperimentFilesService.instance.localSyncDirectoryHandle.name}
                    </span>
                    : <span style={{color: 'gray'}}>Please choose local folder you want to work in.</span>}
                </div>

              </div>
            </div>

            {/* list of experiments */}
            <div className='grid-element experiment-list'>
              <div className='grid-element-header'>
                <div>Experiments</div>
                <div>
                  <button className='nrp-btn'
                    onClick={() => {
                      RemoteExperimentFilesService.instance.toggleAutoSync();
                    }}
                    title={RemoteExperimentFilesService.instance.autoSync ? 'Auto sync: ON' : 'Auto sync: OFF'}
                  >
                    {RemoteExperimentFilesService.instance.autoSync ?
                      <IoSyncCircleSharp /> : <IoSyncCircleOutline />}
                  </button>
                </div>
              </div>

              <ol className='experiment-files-list'>
                {this.props.experiments.map(experiment => {
                  let experimentServerFiles = RemoteExperimentFilesService.instance
                    .serverExperiments.get(experiment.id);
                  let experimentLocalFiles = RemoteExperimentFilesService.instance.localFiles.get(experiment.uuid);

                  return (
                    <li key={experiment.id || experiment.configuration.id}
                      className={this.getExperimentsListItemClass(experiment)}
                      onClick={() => {
                        if (experimentLocalFiles) {
                          this.setState({
                            selectedExperiment: experiment,
                            selectedFile: undefined,
                            selectedFilepaths: undefined
                          });
                        }
                      }}>
                      {experiment.configuration.name}
                      <div className='experiment-li-buttons'>
                        <button className='nrp-btn'
                          disabled={!RemoteExperimentFilesService.instance.localSyncDirectoryHandle}
                          onClick={() => {
                            RemoteExperimentFilesService.instance.downloadExperimentToLocalFS(experiment);
                          }}
                          title='Download all experiment files (will OVERWRITE unsaved local changes)'
                        >
                          <FaDownload />
                        </button>
                        <button className='nrp-btn'
                          disabled={!experimentServerFiles
                            || !RemoteExperimentFilesService.instance.localFiles.has(experiment.uuid)}
                          onClick={() => {
                            RemoteExperimentFilesService.instance.uploadExperimentFromLocalFS(experiment);
                          }}
                          title='Upload all experiment files'
                        >
                          <FaUpload />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* file structure for selected experiment */}
            <div className='grid-element experiment-files'>
              <div className='grid-element-header'>
                <div>Experiment Files</div>
                <div className='grid-element-header-buttons'>
                  <button className='nrp-btn' title='Download selected'
                    disabled={!this.state.selectedFilepaths || this.state.selectedFilepaths.length === 0}
                    onClick={() =>
                      RemoteExperimentFilesService.instance.downloadExperimentFileList(this.state.selectedFilepaths)}>
                    <FaDownload />
                  </button>
                  <button className='nrp-btn' title='Upload selected'
                    disabled={!this.state.selectedFilepaths || this.state.selectedFilepaths.length === 0}
                    onClick={() =>
                      RemoteExperimentFilesService.instance.uploadExperimentFileList(this.state.selectedFilepaths)}>
                    <FaUpload />
                  </button>
                </div>
              </div>

              <div>
                {selectedExperimentFiles ?
                  <TreeView
                    multiSelect
                    className="treeview"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={this.props.experiments.map(experiment => experiment.uuid)}
                    onNodeSelect={(event, nodeIds) => {
                      this.handleFileTreeSelect(event, nodeIds);
                    }}
                  >
                    {this.renderFileTree(selectedExperimentFiles)}
                  </TreeView>
                  : <span style={{margin: '20px'}}>Please select an experiment on the left first.</span>
                }
              </div>
            </div>

            {/* info for selected file */}
            <div className='grid-element selected-file-info'>
              {this.state.selectedFile ?
                <div>
                  {/*(this.state.selectedFile.type === 'folder' ? 'Folder: ' : 'File: ') + this.state.selectedFile.uuid
                  <br />*/}
                  {this.state.selectedFile.msgWarning ?
                    'Warning: ' + this.state.selectedFile.msgWarning
                    : null
                  }
                  {this.state.selectedFile.msgError ?
                    'Error: ' + this.state.selectedFile.msgError
                    : null
                  }
                  {this.state.selectedFile.untracked ?
                    'File exists only locally.'
                    : null
                  }
                  {this.state.selectedFile.hasLocalChanges ?
                    'File has local changes not synced with server.'
                    : null
                  }
                  {this.state.selectedFile.isOutOfSync ?
                    'File is out of sync - file on server has newer changes.'
                    : null
                  }
                </div>
                : null
              }
            </div>
          </div>

          /* error notification for browser other than chrome */
          : <div>
            File System Access API is a working draft and not supported by this browser at the moment.
            Please try one of the supporting browsers.
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
