import React, { Component } from 'react';
import { Modal, Button, Accordion, Dropdown, DropdownButton, Card, Form } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import DataVisualizerService from './data-visualizer-service';

import ChannelSelector from './channel-selector';
import ChannelsSelector from './channels-selector';
import { DetailedProperties, GraphTypeSelector } from './dv-lib';
import PlotElement from './plot-component';

import { InputGroup, FormControl } from 'react-bootstrap';

import { useState } from 'react';
import ReactDOM from 'react-dom';

//import TopicSub from './mqtt-topic-sub.js';

import './data-visualizer.css';

/**
 * Generates and renders the data visualizer component.
 *
 * It has 3 elements
 * - Graph Overview for defining the Plot general characteristics
 * - Data sources for selectin the multiple channels to plot
 * - Plot Visualization for seing, interacting and saving the plot
 *
 *  TODO: MQTT subscriber is not connected for reading the topics
 *  TODO: Interconnect variables and placeholders between components: Graph Name, Channels Name
 *        Selected Channels...
 */
export default class DataVisualizer extends React.Component {

  constructor(props) {
    super(props);
    this.files= [];

    this.state = {
      graphName: '',
      automaticAxesRages: false,
      graphType: 'LinePlot'
    };
    //this.topic_sub = new TopicSub();

  }

  dataVisualizerInterface() {

    return (
      <div>

        <Accordion defaultActiveKey='1'>
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
                Extend this component for setting up graph details

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
                Select channels to plot
                <ChannelsSelector />
              </Card.Body>
            </Accordion.Collapse>
          </Card>
        </Accordion>

        <Accordion>
          <Card>
            <Card.Header>
              <Accordion.Toggle as={Button} variant="text" eventKey="2"onClick={() => {
                console.info('DATA!');
                console.info(DataVisualizerService.instance.getCurrentData);
                DataVisualizerService.instance.emit(
                  DataVisualizerService.EVENTS.PLOT_OPENED, DataVisualizerService.instance.currentData);
              }}>
                  Plots Visualization
              </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey="2">
              <Card.Body>
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
    this.setState({graphNameName: this.graphName});
    const filename = '';
  }

  render(){
    return(
      <this.dataVisualizerInterface />
    );
  }

}
