import React from 'react';
import Plot from 'react-plotly.js';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';
import MqttClientService from '../../services/mqtt-client-service';
import DataVisualizerService from './data-visualizer-service';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';

//Generates the react component with the plotting element
class PlotElement extends React.Component {
  constructor() {
    super();
    this._currentDataX = [0,0,0,0,0,0];
    this._currentDataY = [0,0,0,0,0,0];
    DataVisualizerService.instance.on(DataVisualizerService.EVENTS.PLOT_OPENED, (data) => this._currentDataX = data);
    DataVisualizerService.instance.on(DataVisualizerService.EVENTS.PLOT_OPENED, (data) => this._currentDataY = data);
  }
  //Todo: Currently there appears to be an issue with the protobuf data, meaning the data received is not readable.
  // When this is fixed, then the received data (stored in the currentData) can be fed into the plots below
  state = {  }
  render() {
    console.info('Currently the received data is:');
    console.info(this._currentdataX);
    console.info(this._currentdataY);
    return (
      <Plot
        data={[
          {
            x: [1, 2, 3, 4, 5, 6],
            y: [2, 6, 4, 3, 5, 7],
            name: 'channel_1_name',
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: 'red'}
          },
          {
            name: 'channel_2_name',
            type: 'scatter',
            mode: 'lines+markers',
            x: [1, 2, 3, 4, 5, 6],
            y: [2, 5, 7, 2, 6, 3]
          }
        ]}
        layout={ { title: 'Braitenberg Experiment'}}//*TODO: Replace with the Graph Title placeholder after inherting it
      />
    );
  }
}

export default PlotElement;