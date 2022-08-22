import React from 'react';
import CodeMirror from '@uiw/react-codemirror';

import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';


export default class TransceiverFunctionEditor extends React.Component {

  constructor(props) {
    super(props);

    this.testListTfFiles = ['cg_mqtt.py', 'cg_mqtt_2.py', 'cg_mqtt_3.py'];
    this.state = {
      selectedFilename: this.testListTfFiles[0],
      code: '',
      unsavedChanges: false
    };
  }

  async componentDidMount() {
    this.loadFileContent(this.state.selectedFilename);
  }

  onChangeSelectedFile(event) {
    //TODO: check for unsaved changes
    let filename = event.target.value;
    console.info('onChangeSelectedFile');
    console.info(filename);
    this.setState({selectedFilename: filename});
    this.loadFileContent(filename);
  }

  async loadFileContent(filename) {
    let fileBlob = await ExperimentStorageService.instance.getBlob('mqtt_simple_1', filename, true);
    let fileContent = await fileBlob.text();
    this.setState({code: fileContent});
  }

  onChangeCodemirror(change) {
    //console.info('onChangeCodemirror');
    //console.info(change);
  }

  onClickSave() {
    console.info('Save clicked!');
  }

  render() {
    return (
      <div>
        <select
          name="selectTFFile"
          value={this.state.selectedFilename}
          onChange={(event) => this.onChangeSelectedFile(event)}>
          {this.testListTfFiles.map(file => {
            return (<option key={file} value={file}>{file}</option>);
          })}
        </select>
        <button onClick={this.onClickSave}>Save</button>
        <CodeMirror value={this.state.code} maxHeight="100%" onChange={(change) => this.onChangeCodemirror(change)}/>
      </div>
    );
  }
}
