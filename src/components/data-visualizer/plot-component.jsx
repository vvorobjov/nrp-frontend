import React from 'react';
import Plot from 'react-plotly.js';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';

/**
 * Generates the react component with the plotting element
 * TODO: Replace with list data with the channels, and corresponding associated properties */
class PlotElement extends React.Component {
  state = {  }
  render() {
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