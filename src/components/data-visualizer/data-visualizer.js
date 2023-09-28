import React, { Component } from 'react';
import { Modal, Button, Accordion, Dropdown, DropdownButton, Card, Form } from 'react-bootstrap';
import Plot from 'react-plotly.js';

import ChannelSelector from './channel-selector';
import ChannelsSelector from './channels-selector';
import { DetailedProperties, GraphTypeSelector } from './dv-lib';
import PlotElement from './plot-component';

import { InputGroup, FormControl } from 'react-bootstrap';

import { useState } from 'react';
import ReactDOM from 'react-dom';

//import TopicSub from './mqtt-topic-sub.js';

import './data-visualizer.css';

export default class DataVisualizer extends React.Component {

  constructor(props) {
    super(props);
    this.files= [];

    this.state = {
      selectedFilename: '',
      code: '',
      textChanges: '',
      showDialogUnsavedChanges: false,
      graphType: 'LinePlot'
    };
    console.log('BP3');
    //this.topic_sub = new TopicSub();
  }

  dataVisualizerInterface() {
    return (
      <div>
        <Accordion defaultActiveKey='0'>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="outlined" eventKey="0">
                Graph Overview
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="0">
              <Card.Body>
               Select graph type from dropdown.
                <InputGroup className="mb-3">
                  <GraphTypeSelector />
                </InputGroup>
               Set a graph name
                <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                    <Button variant="outline-secondary">Set Plot Name</Button>
                  </InputGroup.Prepend>
                  <FormControl
                    placeholder="Plot Name"
                    aria-label="PlotName"
                    aria-describedby="basic-addon1"
                  />
                </InputGroup>
                Extendable component for setting up graph details

                <DetailedProperties />
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
        <Accordion>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="link" eventKey="1">
                  Data Sources
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="1">
              <Card.Body>
                +++ Add new channel button
                +++ N Chennel-Selection Components
                <ChannelsSelector />
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
        <Accordion>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="text" eventKey="2">
                  Plot Visualization
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="2">
              <Card.Body>
                View and edit plot
                <PlotElement/>
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>
      </div>
    );
  }

  async componentDidMount() {
    //TODO: initiate the list with all the topics & other initial vars
    this.setState({experimentName: this.experimentID});
    await this.loadExperimentFiles();
    this.setState({selectedFilename:  this.files.at(0)});
    const filename = '';
  }

  async dummy_render() {
    return (
      <div>
        <div className='dv-editor-container'>
          <div className='dv-editor-header'>
            <div className='dv-editor-icon'>DV</div>
            <div className='dv-editor-file-ui'>
              <h5>
                Graph Type:
              </h5>
              <form>
                <select value={this.state.graphType} onGraphChange={this.handleChange}>
                  <option value="Line">Line Plot</option>
                  <option value="Pie">Pie Plot</option>
                  <option value="Scatter">ScatterPlot</option>
                  <option value="Bar">Bar Plot</option>
                  <option value="Area">Fill Area</option>
                  <option value="Scatter">Scatter Plot</option>
                  <option value="BubblesLine">Bubbles</option>
                  <option value="Error Bars">Error Bars</option>
                  <option value="Scatter3D">Scatter 3D</option>
                </select>
              </form>
              <h5>
                Data Source:
              </h5>
              <select
                className='dv-editor-file-ui-item'
                name="selectDVFile"
                value={this.state.selectedFilename}
                //value = {"Line Plot"}
                onChange={(event) => this.onChangeSelectedPlotType(event)}>
                {this.files.map(file => {
                  return (<option key={file} value={file}>{file}</option>);
                })}
              </select>
              <button className='dv-editor-file-ui-item' onClick={() => this.saveDV()}>Create Plot</button>
              <div className={this.hasUnsavedChanges ?
                'dv-editor-text-unsaved' : 'dv-editor-text-saved'}>
                {this.state.textChanges}
              </div>
            </div>
          </div>

          <Plot
            data={[
              {
                x: [1, 2, 3],
                y: [2, 6, 3],
                type: 'scatter',
                mode: 'lines+markers',
                marker: {color: 'red'}
              },
              {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]}
            ]}
            //layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
            //layout={ { title: 'A Fancy Plot'}
            layout={ { title: this.state.graphType}}
          />

          {this.state.showDialogUnsavedChanges ?
            <div>
              <Modal show={this.state.showDialogUnsavedChanges}
                onHide={() => this.setState({showDialogUnsavedChanges: false})}>
                <Modal.Header>
                  <Modal.Title>Unsaved Changes</Modal.Title>
                </Modal.Header>
                <Modal.Body>You have unsaved changes for "{this.pendingFileChange.oldFilename}".
                What would you like to do?</Modal.Body>18
                <Modal.Footer>
                  <div>
                    <Button variant="danger" onClick={() => this.setState({showDialogUnsavedChanges: false})}>
                    Cancel
                    </Button>
                    <Button variant="danger" onClick={() => this.onUnsavedChangesDiscard()}>
                    Discard changes
                    </Button>
                    <Button variant="light" onClick={() => this.onUnsavedChangesSave()}>
                    Create Plot
                    </Button>
                  </div>
                </Modal.Footer>
              </Modal>
            </div>
            : null}
        </div>
      </div>
    );
  }

  comment_render(){
    return(
      <ChannelSelector />
    );
  }

  render(){
    return(
      <this.dataVisualizerInterface />
    );
  }

}
