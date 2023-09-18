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
    );
  }
}

export default PlotElement;