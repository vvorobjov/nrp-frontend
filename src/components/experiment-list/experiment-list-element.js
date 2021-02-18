import React from 'react';
import { FaTrash, FaFileExport, FaShareAlt, FaClone } from 'react-icons/fa';
import { RiPlayFill, RiPlayLine, RiPlayList2Fill } from 'react-icons/ri';
import { VscTriangleUp, VscTriangleDown } from 'react-icons/vsc';
import { GoFileSubmodule } from 'react-icons/go';

import timeDDHHMMSS from '../../utility/time-filter.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';
import PublicExperimentsService from '../../services/experiments/files/public-experiments-service.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';

import SimulationDetails from './simulation-details';
import ExperimentOverview from '../experiment-overview/experiment-overview.js';

import './experiment-list-element.css';
import '../main.css';

const CLUSTER_THRESHOLDS = {
  UNAVAILABLE: 2,
  AVAILABLE: 4
};
const SHORT_DESCRIPTION_LENGTH = 200;

export default class ExperimentListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSimDetails: true
    };

    this.launchButtonTitle = '';

    this.wrapperRef = React.createRef();
  }

  async componentDidMount() {
    this.handleClickOutside = this.handleClickOutside.bind(this);
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.current.contains(event.target)) {
      this.setState({ selected: false });
    }
  }

  getAvailabilityInfo() {
    let status;
    if (this.props.availableServers && this.props.availableServers.length > CLUSTER_THRESHOLDS.AVAILABLE) {
      status = 'Available';
    }
    else if (!this.props.availableServers || this.props.availableServers.length === 0) {
      status = 'Unavailable';
    }
    else {
      status = 'Restricted';
    }

    let backends = `Backends: ${this.props.availableServers.length}`;

    return `${status}\n${backends}`;
  }

  getServerStatusClass() {
    let status = '';
    if (this.props.availableServers && this.props.availableServers.length > CLUSTER_THRESHOLDS.AVAILABLE) {
      status = 'server-status-available';
    }
    else if (!this.props.availableServers || this.props.availableServers.length === 0) {
      status = 'server-status-unavailable';
    }
    else {
      status = 'server-status-restricted';
    }

    return status;
  }

  isLaunchDisabled() {
    let isDisabled = !this.props.experiment.rights.launch ||
      this.props.availableServers.length === 0 ||
      this.props.startingExperiment === this.props.experiment;

    if (!this.props.experiment.rights.launch) {
      this.launchButtonTitle = 'Sorry, no permission to start experiment.';
    }
    else if (this.props.availableServers.length === 0) {
      this.launchButtonTitle = 'Sorry, no available servers.';
    }
    else if (this.props.startingExperiment === this.props.experiment) {
      this.launchButtonTitle = 'Experiment is already starting.';
    }
    else {
      this.launchButtonTitle = '';
    }

    return isDisabled;
    /*|| pageState.deletingExperiment*/
  }

  render() {
    const exp = this.props.experiment;
    const config = this.props.experiment.configuration;

    return (
      <div className='list-entry-wrapper flex-container left-right'
        style={{ position: 'relative' }}
        onClick={() => this.setState({ selected: true })}
        ref={this.wrapperRef}>

        <div className='list-entry-left' style={{ position: 'relative' }}>
          <img className='entity-thumbnail' src={exp.thumbnailURL} alt='' />
        </div>

        <div className='list-entry-middle flex-container up-down'>
          <div className='flex-container left-right title-line'>
            <div className='h4'>
              {config.name}
            </div>
            {exp.joinableServers.length > 0 ?
              <div className='exp-title-sim-info'>
                ({exp.joinableServers.length} simulation{exp.joinableServers.length > 1 ? 's' : ''} running)
              </div>
              : null}
          </div>
          <div>
            {!this.state.selected && config.description.length > SHORT_DESCRIPTION_LENGTH ?
              config.description.substr(0, SHORT_DESCRIPTION_LENGTH) + ' ...' :
              config.description}
            <br />
          </div>

          {this.state.selected &&
            <div className='experiment-details' >
              <i>
                Timeout:
                {timeDDHHMMSS(config.timeout)}
                ({(config.timeoutType === 'simulation' ? 'simulation' : 'real')} time)
              </i>
              <br />
              <i>
                Brain processes: {config.brainProcesses}
              </i>
              <br />
              <div style={{ display: 'flex' }}>
                <i style={{ marginTop: '4px' }}>Server status: </i>
                <i className={'server-icon ' + this.getServerStatusClass()}
                  title={this.getAvailabilityInfo()}></i>
              </div>
            </div>
          }

          {this.state.selected &&
            <div className='list-entry-buttons flex-container' onClick={() => {
              /*return exp.id === pageState.selected;*/
            }}>
              <div className='btn-group' role='group' >
                {exp.rights.launch ?
                  <button
                    onClick={() => {
                      ExperimentExecutionService.instance.startNewExperiment(exp, false);
                    }}
                    disabled={this.isLaunchDisabled()}
                    className='nrp-btn btn-default'
                    title={this.launchButtonTitle} >
                    <RiPlayFill className='icon' />Launch
                  </button>
                  : null}

                {exp.rights.launch /*&& config.brainProcesses > 1*/ ?
                  <button className='nrp-btn btn-default'>
                    <RiPlayLine className='icon' />Launch in Single Process Mode
                  </button>
                  : null}

                {exp.rights.launch /*&& this.props.availableServers.length > 1*/ ?
                  <button className='nrp-btn btn-default' >
                    <RiPlayList2Fill className='icon' />Launch Multiple
                  </button>
                  : null}

                {/* isPrivateExperiment */}
                {exp.rights.delete ?
                  <button className='nrp-btn btn-default' onClick={async () => {
                    await ExperimentStorageService.instance.deleteExperiment(exp.id);
                    ExperimentStorageService.instance.getExperiments(true);
                  }}>
                    <FaTrash className='icon' />Delete
                  </button>
                  : null}

                {/* Records button */}
                {exp.rights.launch ?
                  <button className='nrp-btn btn-default'>
                    {this.state.showRecordings ?
                      <VscTriangleUp className='icon' /> :
                      <VscTriangleDown className='icon' />
                    }
                    Recordings
                  </button>
                  : null}

                {/* Export button */}
                {exp.rights.launch ?
                  <button className='nrp-btn btn-default'>
                    <FaFileExport className='icon' />Export
                  </button>
                  : null}

                {/* Simulations button */}
                {exp.rights.launch && exp.joinableServers.length > 0 ?
                  <button className='nrp-btn btn-default'
                    onClick={() => {
                      this.setState({ showSimDetails: !this.state.showSimDetails });
                    }}>
                    {this.state.showSimDetails ?
                      <VscTriangleUp className='icon' /> :
                      <VscTriangleDown className='icon' />
                    }
                    Simulations
                  </button>
                  : null}

                {/* Clone button */}
                {exp.rights.clone ?
                  <button className='nrp-btn btn-default' onClick={() => {
                    PublicExperimentsService.instance.cloneExperiment(exp);
                    this.props.selectExperimentOverviewTab(ExperimentOverview.CONSTANTS.TAB_INDEX.MY_EXPERIMENTS);
                  }}>
                    <FaClone className='icon' />Clone
                  </button>
                  : null}

                {/* Files button */}
                {exp.rights.launch ?
                  <button className='nrp-btn btn-default' >
                    <GoFileSubmodule className='icon' />Files
                  </button>
                  : null}

                {/* Shared button */}
                {exp.rights.launch ?
                  <button className='nrp-btn btn-default'>
                    <FaShareAlt className='icon' />Share
                  </button>
                  : null}
              </div>
            </div>
          }

          {this.state.selected && exp.joinableServers.length > 0 && this.state.showSimDetails ?
            <SimulationDetails simulations={exp.joinableServers} />
            : null
          }
        </div>
      </div>
    );
  }
}
