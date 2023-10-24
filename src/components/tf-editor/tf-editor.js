import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { python } from '@codemirror/legacy-modes/mode/python';
import { json } from '@codemirror/legacy-modes/mode/javascript';
import { xml } from '@codemirror/legacy-modes/mode/xml';
import { Modal, Button } from 'react-bootstrap';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';

import './tf-editor.css';

const TF_DISABLED_EXT = [
  'zip',
  'bin'
];

export default class TransceiverFunctionEditor extends React.Component {

  constructor(props) {
    super(props);
    this.files = [];

    this.state = {
      selectedFile: { name: '', extension: '' },
      code: '',
      textChanges: '',
      showDialogUnsavedChanges: false,
      codeMirrorMarkup: []
    };
  }

  async componentDidMount() {

    const workbench = await ExperimentWorkbenchService.instance;
    this.experimentID = workbench.experimentID;

    this.setState({ experimentName: this.experimentID });
    await this.loadExperimentFiles();
    const defaultFile = this.files.find(f => f.name === 'simulation_config.json');
    this.setState({ selectedFile: defaultFile ? defaultFile : this.files.at(0) });
    await this.loadFileContent(this.state.selectedFile);
  }

  onChangeSelectedFile(event) {
    let file = this.files.find(f => f.name === event.target.value);
    if (this.hasUnsavedChanges) {
      this.pendingFileChange = {
        newFile: file,
        oldFile: this.state.selectedFile
      };
      this.setState({ showDialogUnsavedChanges: true });
    }
    else {
      this.loadFileContent(file);
    }
  }

  onUnsavedChangesDiscard() {
    this.loadFileContent(this.pendingFileChange.newFile);
    this.setState({ textChanges: 'changes discarded: ' + this.pendingFileChange.oldFile.name });
    setTimeout(() => {
      this.setState({ textChanges: '' });
    }, 3000);
  }

  async onUnsavedChangesSave() {
    let success = await this.saveTF();
    if (success) {
      this.loadFileContent(this.pendingFileChange.newFile);
    }
  }

  async loadExperimentFiles() {
    const filelist = await ExperimentStorageService.instance.getExperimentFiles(this.state.experimentName);
    for (const obj of filelist) { // Not checking for nested files yet
      if (obj.type === 'file') {
        const ext = obj.name.substr(obj.name.lastIndexOf('.') + 1);
        const disabled = TF_DISABLED_EXT.includes(ext);
        this.files.push({ name: obj.name, extension: ext, disabled: disabled });
      }
    }
  }

  /**
   * Loads the contents of the file through proxy.
   * @param {object} file is a file object
   * @param {string} file.name is a file name
   * @param {string} file.extension is a file extension
   */
  async loadFileContent(file) {
    let fileContent = await ExperimentStorageService.instance.getFileText(this.state.experimentName, file.name);
    const codeMirrorMarkup = await this.defineCodeMirrorMarkup(file.extension);
    this.fileLoading = true;
    this.setState({
      selectedFile: file,
      code: fileContent,
      showDialogUnsavedChanges: false,
      codeMirrorMarkup: codeMirrorMarkup
    });
  }

  async defineCodeMirrorMarkup(ext) {
    switch (ext) {
    case 'py':
      return [StreamLanguage.define(python)];
    case 'json':
      return [StreamLanguage.define(json)];
    case 'sdf':
      return [StreamLanguage.define(xml)];
    case 'xml':
      return [StreamLanguage.define(xml)];
    default:
      return [];
    }
  }

  onChangeCodemirror(change, viewUpdate) {
    this.setState({ code: change });
    this.hasUnsavedChanges = !this.fileLoading;
    this.fileLoading = false;
    if (this.hasUnsavedChanges) {
      this.setState({ textChanges: 'unsaved changes' });
    }
  }

  async saveTF() {
    let response = await ExperimentStorageService.instance.setFile(
      this.state.experimentName, this.state.selectedFile.name, this.state.code);
    if (response.ok) {
      this.hasUnsavedChanges = false;
      this.setState({ textChanges: 'saved' });
      setTimeout(() => {
        this.setState({ textChanges: '' });
      }, 3000);
      return true;
    }
    else {
      console.error('Error trying to save TF!');
      console.error(response);
      return false;
    }
  }

  render() {
    return (
      <div className='tf-editor-container'>
        <div className='tf-editor-header'>
          <div className='tf-editor-icon'>TF</div>
          <div className='tf-editor-file-ui'>
            <select
              className='tf-editor-file-ui-item'
              name="selectTFFile"
              value={this.state.selectedFile.name}
              onChange={(event) => this.onChangeSelectedFile(event)}>
              {this.files.map(file => {
                return (<option key={file.name} value={file.name} disabled={file.disabled}>{file.name}</option>);
              })}
            </select>
            <button
              className='tf-editor-file-ui-item'
              onClick={() => this.saveTF()}>
              Save
            </button>
            <div className={this.hasUnsavedChanges ?
              'tf-editor-text-unsaved' : 'tf-editor-text-saved'}>
              {this.state.textChanges}
            </div>
          </div>
        </div>

        <div className='tf-editor-codemirror-container'>
          <CodeMirror
            value={this.state.code}
            onChange={(change, viewUpdate) => this.onChangeCodemirror(change, viewUpdate)}
            extensions={this.state.codeMirrorMarkup} />
        </div>

        {this.state.showDialogUnsavedChanges ?
          <div>
            <Modal className='tf-editor-unsaved-dialog-wrapper' show={this.state.showDialogUnsavedChanges}
              onHide={() => this.setState({ showDialogUnsavedChanges: false })}>
              <Modal.Header>
                <Modal.Title>Unsaved Changes</Modal.Title>
              </Modal.Header>
              <Modal.Body>You have unsaved changes for "{this.pendingFileChange.oldFile.name}".
                What would you like to do?</Modal.Body>
              <Modal.Footer>
                <div>
                  <Button variant="light" onClick={() => this.setState({ showDialogUnsavedChanges: false })}>
                    Cancel
                  </Button>
                  <Button variant="success" onClick={() => this.onUnsavedChangesSave()}>
                    Save
                  </Button>
                  <Button variant="danger" onClick={() => this.onUnsavedChangesDiscard()}>
                    Discard changes
                  </Button>
                </div>
              </Modal.Footer>
            </Modal>
          </div>
          : null}
      </div>
    );
  }
}