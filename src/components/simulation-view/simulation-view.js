import React from 'react';
import FlexLayout from 'flexlayout-react';
import { RiPlayFill, RiLayout6Line } from 'react-icons/ri';
import { GiExitDoor } from 'react-icons/gi';
import { TiMediaRecord } from 'react-icons/ti';
import { VscDebugRestart } from 'react-icons/vsc';

import '../../../node_modules/flexlayout-react/style/light.css';
import './simulation-view.css';

const jsonBaseLayout = {
  global: {},
  borders: [],
  layout:{
    'type': 'row',
    'weight': 100,
    'children': [
      {
        'type': 'tabset',
        'weight': 50,
        'selected': 0,
        'children': [
          {
            'type': 'tab',
            'name': 'FX',
            'component':'grid'
          }
        ]
      },
      {
        'type': 'tabset',
        'weight': 50,
        'selected': 0,
        'children': [
          {
            'type': 'tab',
            'name': 'NEST wiki page',
            'component':'nest_wiki'
          }
        ]
      }
    ]
  }
};

const classNameMapper = (className) => {
  if (className === 'flexlayout__layout') {
    return 'simulation-view-flexlayout';
  }
  else {
    return className;
  }
};

export default class SimulationView extends React.Component {
  constructor(props) {
    super(props);
    console.info(this.state);
    console.info(this.props);

    this.state = {model: FlexLayout.Model.fromJson(jsonBaseLayout)};
    console.info(this.state);
  }

  factory = (node) => {
    var component = node.getComponent();
    if (component === 'button') {
      return <button>{node.getName()}</button>;
    }
    else if (component === 'nest_wiki') {
      return <iframe src='https://en.wikipedia.org/wiki/NEST_(software)' title='nest_wiki'
        className='flexlayout-iframe'></iframe>;
    }
  }

  render() {
    return (
      <div className='simulation-view-wrapper'>
        <div className='simulation-view-header'>
          <div className='simulation-view-controls'>
            <div className='simulation-view-control-buttons'>
              <button className='nrp-btn btn-default'><GiExitDoor className='icon' /></button>
              <button className='nrp-btn btn-default'><VscDebugRestart className='icon' /></button>
              <button className='nrp-btn btn-default'><RiPlayFill className='icon' /></button>
              <button className='nrp-btn btn-default'><TiMediaRecord className='icon' /></button>
            </div>

            <div className='simulation-view-time-info'>
              <div>Simulation time:</div>
              <div>{'00 00:00:00'}</div>
              <div>Real time:</div>
              <div>{'11 11:11:11'}</div>
              <div>Real timeout:</div>
              <div>{'22 22:22:22'}</div>
            </div>
          </div>

          <div className='simulation-view-experiment-title'>experiment title placeholder</div>
          <button className='nrp-btn btn-default'><RiLayout6Line className='icon' /></button>
        </div>
        <div className='simulation-view-sidebar'>
          sidebar
        </div>
        <div className='simulation-view-mainview'>
          <FlexLayout.Layout model={this.state.model} factory={this.factory}
            classNameMapper={classNameMapper}/>
        </div>
      </div>
    );
  }
}
