import React from 'react';
import Plot from 'react-plotly.js';

import { useState } from 'react';
import ReactDOM from 'react-dom';

import './data-visualizer.css';

class PlotElement extends React.Component {
  state = {  }
  render() {
    return (
      <Plot
        data={[
          {
            x: [1, 2, 3, 4, 5, 6],
            y: [2, 6, 4, 3, 5, 7],
            name: 'channel_name',
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: 'red'}
          },
          {type: 'scatter', x: [1, 2, 3, 4, 5, 6], y: [2, 5, 7, 2, 6, 3]}
        ]}//TODO: Replace with list of channels, and corresponding associated properties
        layout={ { title: 'Braitenberg Experiment'}}// *TODO: Replace with the Graph Title placeholderc after in herting
      />
    );
  }
}

export default PlotElement;