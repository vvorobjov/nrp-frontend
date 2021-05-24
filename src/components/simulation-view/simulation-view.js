import React from 'react';
import FlexLayout from 'flexlayout-react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { RiPlayFill, RiPauseFill, RiLayout6Line } from 'react-icons/ri';
import { GiExitDoor } from 'react-icons/gi';
import { TiMediaRecord } from 'react-icons/ti';
import { VscDebugRestart } from 'react-icons/vsc';

import SimulationToolsService from './simulation-tools-service';
import RunningSimulationService from '../../services/experiments/execution/running-simulation-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';

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

export default class SimulationView extends React.Component {
  constructor(props) {
    super(props);

    const {serverIP, simulationID} = props.match.params;
    //console.info('SimulationView ' + serverIP + ' ' + simulationID);
    this.serverIP = serverIP;
    this.simulationID = simulationID;
    this.serverURL = 'http://' + this.serverIP + ':8080'; // this should probably be part of some config

    this.state = {model: FlexLayout.Model.fromJson(jsonBaseLayout)};
    this.updateSimulationInfo();

    this.refLayout = React.createRef();
  }

  async updateSimulationInfo() {
    let simInfo = await RunningSimulationService.instance.getInfo(this.serverURL, this.simulationID);
    console.info(simInfo);
    let experiments = await ExperimentStorageService.instance.getExperiments();
    let experimentName = experiments.find(experiment => experiment.id === simInfo.experimentID).configuration.name;
    console.info(experimentName);

    this.setState({simulationInfo: simInfo, experimentName: experimentName});
  }

  async onButtonStartPause() {
    let newState = this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
      ? EXPERIMENT_STATE.STARTED
      : EXPERIMENT_STATE.PAUSED;
    await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID, newState);

    this.updateSimulationInfo();
  }

  render() {
    return (
      <div className='simulation-view-wrapper'>
        <div className='simulation-view-header'>
          <div className='simulation-view-controls'>
            <div className='simulation-view-control-buttons'>
              <button className='nrp-btn btn-default'><GiExitDoor className='icon' /></button>
              <button className='nrp-btn btn-default'><VscDebugRestart className='icon' /></button>
              <button className='nrp-btn btn-default' onClick={() => {
                this.onButtonStartPause();
              }}>
                {this.state.simulationInfo && this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
                  ? <RiPlayFill className='icon' />
                  : <RiPauseFill className='icon' />}
              </button>
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

          <div className='simulation-view-experiment-title'>{this.state.experimentName}</div>
          <button className='nrp-btn btn-default'><RiLayout6Line className='icon' /></button>
        </div>
        <div className='simulation-view-sidebar'>
          {Array.from(SimulationToolsService.instance.tools.values()).map(tool => {
            return (
              <OverlayTrigger
                key={`overlaytrigger-${tool.flexlayoutNode.component}`}
                placement={'right'}
                overlay={
                  <Tooltip id={`tooltip-${tool.flexlayoutNode.component}`}>
                    {tool.flexlayoutNode.name}
                  </Tooltip>
                }
              >
                <Button key={tool.flexlayoutNode.component}
                  className="simulation-tool-button"
                  onMouseDown={() => {
                    SimulationToolsService.instance.startToolDrag(
                      tool.flexlayoutNode,
                      this.refLayout);
                  }}>{tool.getIcon && tool.getIcon()}</Button>
              </OverlayTrigger>
            );
          })}
        </div>
        <div className='simulation-view-mainview'>
          <FlexLayout.Layout ref={this.refLayout} model={this.state.model}
            factory={(node) => {
              return SimulationToolsService.instance.flexlayoutNodeFactory(node);
            }} />
        </div>
      </div>
    );
  }
}
