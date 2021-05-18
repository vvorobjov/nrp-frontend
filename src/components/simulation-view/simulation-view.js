import React from 'react';
import FlexLayout from 'flexlayout-react';
import { RiPlayFill, RiLayout6Line } from 'react-icons/ri';
import { GiExitDoor } from 'react-icons/gi';
import { TiMediaRecord } from 'react-icons/ti';
import { VscDebugRestart } from 'react-icons/vsc';

import SimulationToolsService from './simulation-tools-service';

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

    this.refLayout = React.createRef();
  }

  factory = (node) => {
    return SimulationToolsService.instance.flexlayoutNodeFactory(node);
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
          {Array.from(SimulationToolsService.instance.tools.values()).map(tool => {
            return (<button onMouseDown={() => {
              SimulationToolsService.instance.startToolDrag(
                tool.flexlayoutNode,
                this.refLayout);
            }}>{tool.flexlayoutNode.name}</button>);
          })}
        </div>
        <div className='simulation-view-mainview'>
          <FlexLayout.Layout ref={this.refLayout} model={this.state.model} factory={this.factory}
            classNameMapper={classNameMapper}/>
        </div>
      </div>
    );
  }
}
