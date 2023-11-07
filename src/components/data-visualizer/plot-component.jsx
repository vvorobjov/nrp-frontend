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
    this._currentData = [0,0,0,0,0,0];
    DataVisualizerService.instance.on(DataVisualizerService.EVENTS.PLOT_OPENED, (data) => this._currentData = data);
  }
  //todo: fire event to datavizualizer when accordian thing is opened (in data-visuzliers)
  //todo: In constructor "onEvent" triggers data coming in here. (Object.freeze style - emit)
  state = {  }
  render() {
    console.info('Currently the received data is:');
    console.info(this._currentdata);
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