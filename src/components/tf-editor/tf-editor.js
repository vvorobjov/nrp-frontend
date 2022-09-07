import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Modal, Button } from 'react-bootstrap';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';


import './tf-editor.css';

export default class TransceiverFunctionEditor extends React.Component {

  constructor(props) {
    super(props);

    this.testListTfFiles = ['cg_mqtt.py', 'cg_mqtt_2.py', 'cg_mqtt_3.py'];
    this.state = {
      selectedFilename: this.testListTfFiles[0],
      code: '',
      textChanges: '',
      showDialogUnsavedChanges: false
    };
  }

  async componentDidMount() {
    this.loadFileContent(this.state.selectedFilename);
  }

  onChangeSelectedFile(event) {
    let filename = event.target.value;
    if (this.hasUnsavedChanges) {
      this.pendingFileChange = {
        newFilename: filename,
        oldFilename: this.state.selectedFilename
      };
      this.setState({showDialogUnsavedChanges: true});
    }
    else {
      this.loadFileContent(filename);
    }
  }

  onUnsavedChangesDiscard() {
    this.loadFileContent(this.pendingFileChange.newFilename);
  }

  async onUnsavedChangesSave() {
    let success = await this.saveTF();
    if (success) {
      this.loadFileContent(this.pendingFileChange.newFilename);
    }
  }

  async loadFileContent(filename) {
    let fileContent = await ExperimentStorageService.instance.getFileText(this.props.experimentId, filename);
    this.fileLoading = true;
    this.setState({selectedFilename: filename, code: fileContent, showDialogUnsavedChanges: false});
  }

  onChangeCodemirror(change, viewUpdate) {
    //console.info(['onChangeCodemirror', viewUpdate]);
    this.setState({code: change});
    this.hasUnsavedChanges = !this.fileLoading;
    this.fileLoading = false;
    if (this.hasUnsavedChanges) {
      this.setState({textChanges: 'unsaved changes'});
    }
    console.info(['this.hasUnsavedChanges', this.hasUnsavedChanges]);
  }

  async saveTF() {
    let response = await ExperimentStorageService.instance.setFile(
      this.props.experimentId, this.state.selectedFilename, this.state.code);
    if (response.ok) {
      this.hasUnsavedChanges = false;
      this.setState({textChanges: 'saved'});
      setTimeout(() => {
        this.setState({textChanges: ''});
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
              value={this.state.selectedFilename}
              onChange={(event) => this.onChangeSelectedFile(event)}>
              {this.testListTfFiles.map(file => {
                return (<option key={file} value={file}>{file}</option>);
              })}
            </select>
            <button className='tf-editor-file-ui-item' onClick={() => this.saveTF()}>Save</button>
            <div className={this.hasUnsavedChanges ?
              'tf-editor-text-unsaved' : 'tf-editor-text-saved'}>
              {this.state.textChanges}
            </div>
          </div>
        </div>

        <div className='tf-editor-codemirror-container'>
          <CodeMirror
            value={this.state.code}
            onChange={(change, viewUpdate) => this.onChangeCodemirror(change, viewUpdate)}/>
        </div>

        {this.state.showDialogUnsavedChanges ?
          <div>
            <Modal show={this.state.showDialogUnsavedChanges}
              onHide={() => this.setState({showDialogUnsavedChanges: false})}>
              <Modal.Header>
                <Modal.Title>Unsaved Changes</Modal.Title>
              </Modal.Header>
              <Modal.Body>You have unsaved changes for "{this.pendingFileChange.oldFilename}".
              What would you like to do?</Modal.Body>
              <Modal.Footer>
                <div>
                  <Button variant="danger" onClick={() => this.setState({showDialogUnsavedChanges: false})}>
                  Cancel
                  </Button>
                  <Button variant="danger" onClick={() => this.onUnsavedChangesDiscard()}>
                  Discard changes
                  </Button>
                  <Button variant="light" onClick={() => this.onUnsavedChangesSave()}>
                  Save
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
