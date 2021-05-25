import React from 'react';
import FlexLayout from 'flexlayout-react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { RiPlayFill, RiPauseFill, RiLayout6Line } from 'react-icons/ri';
import { GiExitDoor } from 'react-icons/gi';
import { TiMediaRecord } from 'react-icons/ti';
import { VscDebugRestart } from 'react-icons/vsc';

import SimulationToolsService from './simulation-tools-service';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service';
import RunningSimulationService from '../../services/experiments/execution/running-simulation-service';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants';
import timeDDHHMMSS from '../../utility/time-filter';

import LeaveSimulationDialog from './leave-simulation-dialog';

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

    this.state = {
      model: FlexLayout.Model.fromJson(jsonBaseLayout),
      showLeaveDialog: false
    };

    this.refLayout = React.createRef();
  }

  async componentDidMount() {
    console.info('componentDidMount');
    await this.updateSimulationInfo();
    let experiments = await ExperimentStorageService.instance.getExperiments();
    console.info(this.state);
    let experimentInfo = experiments.find(experiment => experiment.id === this.state.simulationInfo.experimentID);
    console.info(experimentInfo);
    let experimentName = experimentInfo.configuration.name;
    this.setState({experimentName: experimentName});

    this.intervalUpdateInternalPageInfo = setInterval(() => {
      this.updateInternalPageInfo();
    }, SimulationView.CONSTANTS.INTERVAL_INTERNAL_UPDATE_MS);
  }

  componentWillUnmount() {
    this.intervalUpdateInternalPageInfo && clearInterval(this.intervalUpdateInternalPageInfo);
  }

  async updateSimulationInfo() {
    console.info('updateSimulationInfo');
    let simInfo = await RunningSimulationService.instance.getInfo(this.serverURL, this.simulationID);
    this.setState({simulationInfo: simInfo});
    console.info('updateSimulationInfo - after setState');
    console.info(this.state);
  }

  async updateInternalPageInfo() {
    if (!this.state.simulationInfo) {
      return;
    }

    let dateNow = new Date();
    let dateSimCreation = new Date(this.state.simulationInfo.creationDate);
    this.setState({simulationTimingRealtime: timeDDHHMMSS((dateNow - dateSimCreation) / 1000)});
  }

  async onButtonStartPause() {
    let newState = this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
      ? EXPERIMENT_STATE.STARTED
      : EXPERIMENT_STATE.PAUSED;
    await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID, newState);

    this.updateSimulationInfo();
  }

  showLeaveDialog(show) {
    this.setState({showLeaveDialog: show});
  }

  leaveSimulation() {
    this.props.history.push({
      pathname: '/experiments-overview'
    });
  }

  render() {
    return (
      <div>
        <LeaveSimulationDialog visible={this.state.showLeaveDialog}
          setVisibility={(visible) => this.showLeaveDialog(visible)}
          stopSimulation={async () => {
            await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID,
              EXPERIMENT_STATE.STOPPED);
            this.leaveSimulation();
          }}
          leaveSimulation={() => {
            this.leaveSimulation();
          }} />
        <div className='simulation-view-wrapper'>
          <div className='simulation-view-header'>
            <div className='simulation-view-controls'>
              <div className='simulation-view-control-buttons'>
                <button className='nrp-btn btn-default' onClick={() => this.showLeaveDialog(true)}>
                  <GiExitDoor className='icon' />
                </button>
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
                <div>{this.state.simulationTimingRealtime}</div>
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
      </div>
    );
  }
}

SimulationView.CONSTANTS = Object.freeze({
  INTERVAL_INTERNAL_UPDATE_MS: 1000
});
