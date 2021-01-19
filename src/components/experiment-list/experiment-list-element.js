import React from 'react';
import timeDDHHMMSS from '../../utility/time-filter.js';
import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';
import ExperimentServerService from '../../services/experiments/execution/experiment-server-service.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';

import SimulationDetails from './simulation-details';

import './experiment-list-element.css';

const CLUSTER_THRESHOLDS = {
  UNAVAILABLE: 2,
  AVAILABLE: 4
};
const SHORT_DESCRIPTION_LENGTH = 200;

export default class ExperimentListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.canLaunchExperiment = (this.props.experiment.private && this.props.experiment.owned) ||
      !this.props.experiment.private;
    this.launchButtonTitle = '';

    this.wrapperRef = React.createRef();
  }

  async componentDidMount() {
    // retrieve the experiment thumbnail
    let thumbnail = await ExperimentStorageService.instance.getThumbnail(
      this.props.experiment.name,
      this.props.experiment.configuration.thumbnail);
    this.setState({
      thumbnail: URL.createObjectURL(thumbnail)
    });

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
    const clusterAvailability = ExperimentServerService.instance.getClusterAvailability();

    let status;
    if (clusterAvailability && clusterAvailability.free > CLUSTER_THRESHOLDS.AVAILABLE) {
      status = 'Available';
    }
    else if (!this.props.availableServers || this.props.availableServers.length === 0) {
      status = 'Unavailable';
    }
    else {
      status = 'Restricted';
    }

    let cluster = `Cluster availability: ${clusterAvailability.free} / ${clusterAvailability.total}`;
    let backends = `Backends: ${this.props.availableServers.length}`;

    return `${status}\n${cluster}\n${backends}`;
  }

  getServerStatusClass() {
    const clusterAvailability = ExperimentServerService.instance.getClusterAvailability();

    let status = '';
    if (clusterAvailability && clusterAvailability.free > CLUSTER_THRESHOLDS.AVAILABLE) {
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
    let isDisabled = !this.canLaunchExperiment ||
      this.props.availableServers.length === 0 ||
      this.props.startingExperiment === this.props.experiment;

    if (!this.canLaunchExperiment) {
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
    //const pageState = this.props.pageState;  //TODO: to be removed, migrate to services

    return (
      <div className='list-entry-wrapper flex-container left-right'
        style={{ position: 'relative' }}
        onClick={() => this.setState({ selected: true })}
        ref={this.wrapperRef}>

        <div className='list-entry-left' style={{ position: 'relative' }}>
          <img className='entity-thumbnail' src={this.state.thumbnail} alt='' />
        </div>

        <div className='list-entry-middle flex-container up-down'>
          <div className='flex-container left-right title-line'>
            <div className='h4'>
              {exp.configuration.name}
            </div>
            <br />
          </div>
          <div>
            {!this.state.selected && exp.configuration.description.length > SHORT_DESCRIPTION_LENGTH ?
              exp.configuration.description.substr(0, SHORT_DESCRIPTION_LENGTH) + ' ...' :
              exp.configuration.description}
            <br />
          </div>

          {this.state.selected &&
            <div style={{ position: 'relative' }} >
              <i>
                Timeout:
                {timeDDHHMMSS(exp.configuration.timeout)}
                ({(exp.configuration.timeoutType === 'simulation' ? 'simulation' : 'real')} time)
              </i>
              <br />
              <i>
                Brain processes: {exp.configuration.brainProcesses}
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
                {this.canLaunchExperiment &&
                  exp.configuration.experimentFile && exp.configuration.bibiConfSrc
                  ? <button onClick={() => {
                    ExperimentExecutionService.instance.startNewExperiment(exp, false);
                  }}
                  disabled={this.isLaunchDisabled()}
                  className='btn btn-default'
                  title={this.launchButtonTitle} >
                    <i className='fa fa-plus'></i> Launch
                  </button>
                  : null}

                {this.canLaunchExperiment && config.brainProcesses > 1 &&
                  this.props.availableServers.length > 0 &&
                  exp.configuration.experimentFile && exp.configuration.bibiConfSrc

                  ? <button className='btn btn-default'>
                    <i className='fa fa-plus'></i> Launch in Single Process Mode
                  </button>
                  : null}

                {this.canLaunchExperiment && this.props.availableServers.length > 1 &&
                  exp.configuration.experimentFile && exp.configuration.bibiConfSrc

                  ? <button className='btn btn-default' >
                    <i className='fa fa-layer-group'></i> Launch Multiple
                  </button>
                  : null}

                {/* isPrivateExperiment */}
                {this.canLaunchExperiment
                  ? <button className='btn btn-default'>
                    <i className='fa fa-times'></i> Delete
                  </button>
                  : null}

                {/* Records button */}
                {this.canLaunchExperiment
                  ? <button className='btn btn-default'>
                    <i className='fa fa-sign-in'></i> Recordings »
                  </button>
                  : null}

                {/* Export button */}
                {this.canLaunchExperiment
                  ? <button className='btn btn-default'>
                    <i className='fa fa-file-export'></i> Export
                  </button>
                  : null}

                {/* Simulations button */}
                {this.canLaunchExperiment && exp.joinableServers.length > 0
                  ? <button className='btn btn-default' >
                    <i className='fa fa-sign-in'></i> Simulations »
                  </button>
                  : null}

                {/* Clone button */}
                {config.canCloneExperiments && (!exp.configuration.privateStorage ||
                  (exp.configuration.experimentFile && exp.configuration.bibiConfSrc))
                  ? <button className='btn btn-default'>
                    <i className='fa fa-pencil-alt'></i> Clone
                  </button>
                  : null}

                {/* Files button */}
                {this.canLaunchExperiment
                  ? <button className='btn btn-default' >
                    <i className='fa fa-list-alt'></i> Files
                  </button>
                  : null}

                {/* Shared button */}
                {this.canLaunchExperiment
                  ? <button className='btn btn-default'>
                    <i className='fas fa-share-alt'></i> Share
                  </button>
                  : null}
              </div>
            </div>
          }
          {/*this.state.selected && exp.joinableServers.length > 0*/ true ?
            <SimulationDetails simulations={exp.joinableServers} />
            : null
          }
        </div>
      </div>
    );
  }
}
