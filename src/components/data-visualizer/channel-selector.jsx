import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { Card, InputGroup, FormControl, Modal, Button, Form, Col, Row } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import MqttClientService from '../../services/mqtt-client-service';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';
/**
* Generates the elements for selecting the graph type.
* @param {} - nothing
* @returns {JSX} ChannelSelector - JSX Element for naming and choosing XY chanels to plot
. TODO: Replace List with List of topics from the MQTT Topic List
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
    console.info('inside the channel component');
    console.info(allTopics);

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
        <Form.Control as="select">
          <option>Time</option>
          <option>Joint Angle 1</option>
          <option>Joint Angle 2</option>
          <option>Joint Angle 3</option>
          <option>Joint Speed 1</option>
          <option>Joint Speed 2</option>
          <option>Joint Speed 3</option>
        </Form.Control>
        Variable for the Y Axis:
        <Form.Control as="select">
          <option>Joint Angle 1</option>
          <option>Joint Angle 2</option>
          <option>Joint Angle 3</option>
          <option>Joint Speed 1</option>
          <option>Joint Speed 2</option>
          <option>Joint Speed 3</option>
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
