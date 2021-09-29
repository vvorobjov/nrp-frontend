import React from 'react';
import FlexLayout from 'flexlayout-react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { RiPlayFill, RiPauseFill, RiLayout6Line } from 'react-icons/ri';
import { GiExitDoor } from 'react-icons/gi';
import { TiMediaRecord } from 'react-icons/ti';
import { VscDebugRestart } from 'react-icons/vsc';

import SimulationToolsService from './simulation-tools-service';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service.js';
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
      modelFlexLayout: FlexLayout.Model.fromJson(jsonBaseLayout),
      showLeaveDialog: false
    };

    this.refLayout = React.createRef();
  }

  async componentDidMount() {
    await this.updateSimulationInfo();
    let experiments = await ExperimentStorageService.instance.getExperiments();
    this.experimentInfo = experiments.find(experiment => experiment.id === this.state.simulationInfo.experimentID);
    console.info('SimulationView - experimentInfo');
    console.info(this.experimentInfo);

    let experimentName = this.experimentInfo.configuration.name;
    this.setState({experimentName: experimentName});

    let server = this.experimentInfo.joinableServers.find(
      server => server.runningSimulation.creationUniqueID === this.state.simulationInfo.creationUniqueID);
    this.serverConfig = await ServerResourcesService.instance.getServerConfig(server.server);
    console.info('this.serverConfig');
    console.info(this.serverConfig);
    RunningSimulationService.instance.addRosStatusInfoCallback(
      this.serverConfig.rosbridge.websocket,
      (data) => {
        this.onStatusInfoROS(data);
      }
    );
  }

  async updateSimulationInfo() {
    let simInfo = await RunningSimulationService.instance.getInfo(this.serverURL, this.simulationID);
    this.setState({simulationInfo: simInfo});
    console.info('SimulationView.updateSimulationInfo - simulationInfo');
    console.info(this.state.simulationInfo);
  }

  onStatusInfoROS(message) {
    this.setState({
      timingRealtime: timeDDHHMMSS(message.realTime),
      timingSimulationTime: timeDDHHMMSS(message.simulationTime),
      timingTimeout: timeDDHHMMSS(message.timeout)
    });
  }

  async onButtonStartPause() {
    let newState = this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
      ? EXPERIMENT_STATE.STARTED
      : EXPERIMENT_STATE.PAUSED;
    await RunningSimulationService.instance.updateState(this.serverURL, this.simulationID, newState);

    this.updateSimulationInfo();
  }

  onButtonLayout() {
    console.info(this.state.modelFlexLayout.toJson());
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
                <button disabled={true} className='nrp-btn btn-default'><VscDebugRestart className='icon' /></button>
                <button className='nrp-btn btn-default' onClick={() => {
                  this.onButtonStartPause();
                }}>
                  {this.state.simulationInfo && this.state.simulationInfo.state === EXPERIMENT_STATE.PAUSED
                    ? <RiPlayFill className='icon' />
                    : <RiPauseFill className='icon' />}
                </button>
                <button disabled={true} className='nrp-btn btn-default'><TiMediaRecord className='icon' /></button>
              </div>

              <div className='simulation-view-time-info'>
                <div>Simulation time:</div>
                <div>{this.state.timingSimulationTime}</div>
                <div>Real time:</div>
                <div>{this.state.timingRealtime}</div>
                <div>Real timeout:</div>
                <div>{this.state.timingTimeout}</div>
              </div>
            </div>

            <div className='simulation-view-experiment-title'>{this.state.experimentName}</div>
            <button className='nrp-btn btn-default' onClick={() => {
              this.onButtonLayout();
            }}><RiLayout6Line className='icon' /></button>
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
            <FlexLayout.Layout ref={this.refLayout} model={this.state.modelFlexLayout}
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