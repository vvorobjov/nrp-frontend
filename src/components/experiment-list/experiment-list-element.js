import React, {useState} from 'react';
import { Link, useHistory } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import { FaTrash, FaFileExport, FaShareAlt, FaClone, FaBullseye, FaLastfmSquare } from 'react-icons/fa';
import { MdOutlineDownloadDone } from 'react-icons/md';
import { RiPlayFill, RiPlayLine, RiPlayList2Fill } from 'react-icons/ri';
import { GoX } from 'react-icons/go';
import { VscTriangleUp, VscTriangleDown, VscCheck, VscEdit, VscDiscard} from 'react-icons/vsc';
import { AiFillExperiment } from 'react-icons/ai';
import { GoFileSubmodule } from 'react-icons/go';

import timeDDHHMMSS from '../../utility/time-filter.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';
import PublicExperimentsService from '../../services/experiments/files/public-experiments-service.js';
import ExperimentStorageService from '../../services/experiments/files/experiment-storage-service.js';
import RemoveExperimentDialog from './remove-experiment-dialog';

import SimulationDetails from './simulation-details';
import ExperimentOverview from '../experiments-overview/experiments-overview.js';

import './experiment-list-element.css';
import '../main.css';
import { Button } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { TiEjectOutline } from 'react-icons/ti';

const CLUSTER_THRESHOLDS = {
  UNAVAILABLE: 2,
  AVAILABLE: 4
};
const SHORT_DESCRIPTION_LENGTH = 200;

class ExperimentListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSimDetails: true,
      showRemoveDialog: false,
      nameEditingVisible: false,
      templateTab: props.templateTab,
      visibleName: props.experiment.configuration.SimulationName,
      cloneInProgress: false
    };

    this.launchButtonTitle = '';

    this.wrapperRef = React.createRef();
  }

  async componentDidMount() {
    this.state.edibleName = this.state.visibleName;
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

  openExperimentWorkbench = (expID) => {
    this.props.history.push({
      pathname: '/experiment/' + expID
    });
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

  showRemoveDialog(show) {
    this.setState({showRemoveDialog: show});
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
  };

  render() {
    const exp = this.props.experiment;
    const config = this.props.experiment.configuration;

    return (
      <div className='list-entry-wrapper flex-container left-right'
        style={{ position: 'relative' }}
        onClick={() => this.setState({ selected: true })}
        ref={this.wrapperRef}>

        {/* This is the remove dialog */}
        <RemoveExperimentDialog visible={this.state.showRemoveDialog}
          setVisibility={(visible) => this.showRemoveDialog(visible)}
          removeExperiment={async () => {
            await ExperimentStorageService.instance.deleteExperiment(exp.id);
            ExperimentStorageService.instance.getExperiments(true);
          }}
        />

        {/* TODO: the thumbnailURL is empty for experiments (not templates) view */}
        <div className='list-entry-left' style={{ position: 'relative' }}>
          <img className='entity-thumbnail'
            src={exp.thumbnailURL ? exp.thumbnailURL : '/thumbnails/Two-sided_Brain.jpg'} alt='' />
        </div>

        <div className='list-entry-middle flex-container up-down'>
          <div className='flex-container left-right title-line'>
            {this.state.templateTab || !this.state.nameEditingVisible ?
              <div className='h4'>
                {this.state.visibleName}
              </div>
              :
              null
            }
            {!this.state.templateTab && this.state.nameEditingVisible ?
              <input type='text'
                value={this.state.edibleName}
                disabled={!this.state.nameEditingVisible}
                onChange={(e) => {
                  this.setState({edibleName: e.target.value});
                }}/>
              :
              null
            }
            { this.state.nameEditingVisible && !this.state.templateTab ?
              <button className='list-entry-edit-buttons' onClick={() => {
                this.setState({ nameEditingVisible: false });
                this.setState({ visibleName: this.state.edibleName});
                ExperimentStorageService.instance.renameExperiment(exp.id, this.state.edibleName);
              }}>
                <VscCheck/>
              </button>
              :
              null
            }
            { this.state.nameEditingVisible && !this.state.templateTab ?
              <button className='list-entry-edit-buttons' onClick={() => {
                this.setState({ nameEditingVisible: false });
                this.setState({ edibleName: this.state.visibleName});
              }}>
                <VscDiscard/>
              </button>
              :
              null
            }
            { !this.state.nameEditingVisible && !this.state.templateTab ?
              <button className='list-entry-edit-buttons' onClick={() => this.setState(
                { nameEditingVisible: true })}>
                <VscEdit/>
              </button>
              :
              null
            }

            {exp.joinableServers.length = 0 ?
              <div className='exp-title-sim-info'>
                ({exp.joinableServers.length} simulation{exp.joinableServers.length > 1 ? 's' : ''} running)
              </div>
              : null}
          </div>
          <div>
            {!this.state.selected && config.SimDescription.length > SHORT_DESCRIPTION_LENGTH ?
              config.SimDescription.substr(0, SHORT_DESCRIPTION_LENGTH) + ' ...' :
              config.SimDescription}
            <br />
          </div>

          {this.state.selected &&
            <div className='experiment-details' >
              <i>
                Timeout: {config.SimulationTimeout}
                ({(config.timeoutType === 'simulation' ? 'simulation' : 'real')} time)
              </i>
              <br />
              {/*<i>
                Brain processes: {config.brainProcesses}
              </i>
              <br />*/}
              <div style={{ display: 'flex' }}>
                <i style={{ marginTop: '4px' }}>Server status: </i>
                <i className={'server-icon ' + this.getServerStatusClass()}
                  title={this.getAvailabilityInfo()}></i>
              </div>
            </div>
          }

          {this.state.selected &&
            <div className='list-entry-buttons flex-container' >
              <div className='btn-group' role='group' >
                {exp.rights.launch ?
                  <Button className="nrp-btn btn-default"
                    onClick={() => {
                      this.openExperimentWorkbench(exp.id);
                    }}
                  >
                    <AiFillExperiment className='icon' />Open
                  </Button>
                  : null}

                {/* Files button
                TODO: [NRRPLT-8682]
                Change Files icon and make the file aditor to be the opened tab in the experiment-workbench
                {<Link to={'/experiment/' + exp.id}
                  className="nrp-btn btn-default" disabled={this.isLaunchDisabled()}>
                  <AiFillExperiment className='icon' />Files
                </Link>
                } */}

                {/*exp.rights.launch && config.brainProcesses > 1 ?
                  <button className='nrp-btn btn-default'>
                    <RiPlayLine className='icon' />Launch in Single Process Mode
                  </button>
                  : null*/}

                {/*exp.rights.launch && this.props.availableServers.length > 1 ?
                  <button className='nrp-btn btn-default' >
                    <RiPlayList2Fill className='icon' />Launch Multiple
                  </button>
                : null*/}

                {/* isPrivateExperiment */}
                {exp.rights.delete ?
                  <Button className='nrp-btn btn-default'
                    variant='warning'
                    onClick={() => {
                      this.showRemoveDialog(true);
                    }}
                  >
                    <FaTrash className='icon' />Delete
                  </Button>
                  : null}

                {/* Records button */}
                {exp.rights.launch ?
                  <Button className='nrp-btn btn-default'
                    variant='secondary'>
                    {this.state.showRecordings ?
                      <VscTriangleUp className='icon' /> :
                      <VscTriangleDown className='icon' />
                    }
                    Recordings
                  </Button>
                  : null}

                {/* Export button */}
                {exp.rights.launch ?
                  <Button className='nrp-btn btn-default'
                    variant='secondary'>
                    <FaFileExport className='icon' />Export
                  </Button>
                  : null}

                {/* Simulations button */}
                {exp.rights.launch && exp.joinableServers.length > 0 ?
                  <Button className='nrp-btn btn-default'
                    variant='primary'
                    onClick={() => {
                      this.setState({ showSimDetails: !this.state.showSimDetails });
                    }}>
                    {this.state.showSimDetails ?
                      <VscTriangleUp className='icon' /> :
                      <VscTriangleDown className='icon' />
                    }
                    Simulations
                  </Button>
                  : null}

                {/* Clone button */}
                <Button className='nrp-btn btn-default' disabled={!exp.rights.clone}
                  variant='secondary'
                  onClick={async () => {
                    this.setState({ cloneInProgress: true });
                    // exp.name property belongs to the storage experiments
                    if (exp.name){
                      // Clone storage experiment
                      await ExperimentStorageService.instance.cloneExperiment(exp);
                    }
                    else {
                      // Clone template experiment
                      await PublicExperimentsService.instance.cloneExperiment(exp);
                    }
                    // Wait the cloning to finish
                    await ExperimentStorageService.instance.getExperiments(true).then(() => {
                      this.setState({cloneInProgress: false});
                    });
                    this.props.selectExperimentOverviewTab(ExperimentOverview.CONSTANTS.TAB_INDEX.MY_EXPERIMENTS);
                  }}
                >
                  {this.state.cloneInProgress
                    ? <Spinner animation="border" variant="secondary" size="sm" />
                    : <FaClone className='icon' />
                  } Clone
                </Button>

                {/* Shared button */}
                {exp.rights.launch ?
                  <Button className='nrp-btn btn-default'
                    variant='secondary'>
                    <FaShareAlt className='icon' />Share
                  </Button>
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
export default withRouter(ExperimentListElement);
