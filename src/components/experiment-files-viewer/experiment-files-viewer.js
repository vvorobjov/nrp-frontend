import React from 'react';
import { FaDownload, FaUpload, FaSearch } from 'react-icons/fa';
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
      selectedFileUUIDs: undefined,
      selectedFile: undefined
    };
  }

  handleFileTreeSelect(event, nodeIds) {
    //console.info(nodeIds);
    this.setState({selectedFileUUIDs: nodeIds});
    if (nodeIds.length === 1) {
      let file = RemoteExperimentFilesService.instance.getLocalFileByUUID(nodeIds[0]);
      //console.info(file);
      this.setState({selectedFile: file});
    }
    else {
      this.setState({selectedFile: undefined});
    }
  }

  renderFileTree(file) {
    let className = '';
    if (file.hasLocalChanges) {
      className += ' file-local-changes';
    }
    if (file.dirtyOnServer) {
      className += ' file-dirty';
    }
    className = className.trim();

    return (
      <TreeItem key={file.relativePath} nodeId={file.relativePath} label={file.fileSystemHandle.name}
        className={className}>
        {Array.isArray(file.children) ? file.children.map((subfile) => this.renderFileTree(subfile)) : null}
      </TreeItem>);
  }

  getExperimentsListItemClass(experiment) {
    let className = 'experiments-li';
    if (this.state.selectedExperiment && this.state.selectedExperiment.id === experiment.id) {
      className += ' experiments-li-selected';
    }
    if (!RemoteExperimentFilesService.instance.serverExperiments.has(experiment.id)) {
      className += ' experiments-li-disabled';
    }

    return className;
  }

  render() {
    let selectedExperimentFiles = this.state.selectedExperiment ?
      RemoteExperimentFilesService.instance.localFiles.get(this.state.selectedExperiment.id) : undefined;
    //console.info(selectedExperimentFiles);

    return (
      <div>
        {RemoteExperimentFilesService.instance.isSupported() ?
          <div className='experiment-files-viewer-wrapper'>
            {/* choose the local parent directory for experiment files */}
            <div className='grid-element local-directory-picker'>
              <div className='grid-element-header'>Local parent directory for experiment files</div>
              <div className='elements-local-directory'>
                <div className='local-directory-name'>
                  {RemoteExperimentFilesService.instance.localSyncDirectoryHandle ?
                    <span>
                      {RemoteExperimentFilesService.instance.localSyncDirectoryHandle.name}
                    </span>
                    : <span style={{color: 'gray'}}>Please choose</span>}
                </div>

                <button className='nrp-btn'
                  onClick={() => {
                    RemoteExperimentFilesService.instance.chooseLocalSyncDirectory();
                  }}
                  title='Choose sync directory'
                >
                  <FaSearch />
                </button>
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
                    title={'Set auto sync: ' + RemoteExperimentFilesService.instance.autoSync ? 'OFF' : 'ON'}
                  >
                    {RemoteExperimentFilesService.instance.autoSync ?
                      <IoSyncCircleSharp size='1.5em'/> : <IoSyncCircleOutline size='1.5em'/>}
                  </button>
                </div>
              </div>
              <ol className='experiment-files-list'>
                {this.props.experiments.map(experiment => {
                  let experimentSetup = RemoteExperimentFilesService.instance
                    .serverExperiments.get(experiment.id);

                  return (
                    <li key={experiment.id || experiment.configuration.id}
                      className={this.getExperimentsListItemClass(experiment)}
                      onClick={() => {
                        if (experimentSetup) {
                          this.setState({selectedExperiment: experiment, selectedFile: undefined});
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
                          disabled={!experimentSetup}
                          onClick={() => {
                            RemoteExperimentFilesService.instance.uploadLocalFSExperimentToStorage(experiment);
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
                <div>
                  <button className='nrp-btn' title='Download selected'>
                    <FaDownload />
                  </button>
                  <button className='nrp-btn' title='Upload selected'><FaUpload /></button>
                </div>
              </div>
              <div>
                {selectedExperimentFiles ?
                  <TreeView
                    multiSelect
                    className="treeview"
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    defaultExpanded={[selectedExperimentFiles.fileSystemHandle.name]}
                    onNodeSelect={(event, nodeIds) => {
                      this.handleFileTreeSelect(event, nodeIds);
                    }}
                  >
                    {this.renderFileTree(selectedExperimentFiles)}
                  </TreeView>
                  : <span style={{margin: '20px'}}>No local mirror of experiment files available.</span>
                }
              </div>
            </div>

            {/* info for selected file */}
            <div className='grid-element selected-file-info'>
              {this.state.selectedFile ?
                <div>
                  {(this.state.selectedFile.type === 'folder' ? 'Folder: ' : 'File: ') + this.state.selectedFile.uuid}
                  <br />
                  {this.state.selectedFile.info ?
                    'Info: ' + this.state.selectedFile.info
                    : null
                  }
                </div>
                : null
              }
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
