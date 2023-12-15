import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { Card, InputGroup, FormControl, Modal, Button, Form, Col, Row } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import MqttClientService from '../../services/mqtt-client-service';
import DataVisualizerService from './data-visualizer-service';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';
/**
* Generates the elements for selecting the graph type.
* @param {} - nothing
* @returns {JSX} ChannelSelector - JSX Element for naming and choosing XY chanels to plot
. TODO: There is a bug where the default option is not saved to the plotComponent variable.
*        It works if you switch to another one, and then switch back. But this is awkward.
*/

export default class ChannelSelector extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedFilename: '',
      code: ''
    };
  }

  async componentDidMount() {
    return false;
  }

  singleChannelComponent(){

    const allTopics = ExperimentWorkbenchService.instance.topicList;

    return(
      <Card><Card.Body>
        <Card.Title><InputGroup className="mb-3">
          <InputGroup.Prepend>
            <Button variant="outline-secondary">Set Channel Name</Button>
          </InputGroup.Prepend>
          <FormControl
            placeholder="Channel Name"
            aria-label="ChannelName"
            aria-describedby="basic-addon1"/>
        </InputGroup></Card.Title>
        Variable for the X Axis:
        <Form.Control as="select" onChange={
          e => DataVisualizerService.instance.plotComponentX = e.target.value}>
          {allTopics.map((allTopics, i) => (
            <option key={i}>
              {allTopics}
            </option>
          ))}
        </Form.Control>
        Variable for the Y Axis:
        <Form.Control as="select" onChange={
          e => DataVisualizerService.instance.plotComponentY = e.target.value}>
          {allTopics.map((allTopics, i) => (
            <option key={i}>
              {allTopics}
            </option>
          ))}
        </Form.Control>
      </Card.Body></Card>
    );
  }

  render(){
    return(
      <div>{this.singleChannelComponent()}</div>
    );
  }
}
