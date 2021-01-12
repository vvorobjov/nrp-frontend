import React from 'react';
import timeDDHHMMSS from '../../utility/time-filter.js';
import ExperimentStorageService from '../../services/experiments/storage/experiment-storage-service.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';
import ExperimentServerService from '../../services/experiments/execution/experiment-server-service.js';

import './experiment-list-element.css';

const CLUSTER_THRESHOLDS = {
  UNAVAILABLE: 2,
  AVAILABLE: 4
};
const SHORT_DESCRIPTION_LENGTH = 200;

export default class ExperimentListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {availableServers: [], experimentStarting: false};

    this.canLaunchExperiment = (this.props.experiment.private && this.props.experiment.owned) ||
    !this.props.experiment.private;

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

    this.onUpdateServerAvailability = this.onUpdateServerAvailability.bind(this);
    ExperimentServerService.instance.addListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );

    this.onStartExperiment = this.onStartExperiment.bind(this);
    ExperimentExecutionService.instance.addListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);

    ExperimentServerService.instance.removeListener(
      ExperimentServerService.EVENTS.UPDATE_SERVER_AVAILABILITY,
      this.onUpdateServerAvailability
    );
    ExperimentServerService.instance.removeListener(
      ExperimentExecutionService.EVENTS.START_EXPERIMENT,
      this.onStartExperiment
    );
  }

  onUpdateServerAvailability(availableServers) {
    this.setState({availableServers: availableServers});
  };

  onStartExperiment(experiment) {
    this.setState({experimentStarting: experiment === this.props.experiment});
  };

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.current.contains(event.target)) {
      this.setState({selected: false});
    }
  }

  getAvailabilityInfo() {
    const clusterAvailability = ExperimentServerService.instance.getClusterAvailability();

    let status;
    if (clusterAvailability && clusterAvailability.free > CLUSTER_THRESHOLDS.AVAILABLE) {
      status = 'Available';
    }
    else if (!this.state.availableServers || this.state.availableServers.length === 0) {
      status = 'Unavailable';
    }
    else {
      status = 'Restricted';
    }

    let cluster = `Cluster availability: ${clusterAvailability.free} / ${clusterAvailability.total}`;
    let backends = `Backends: ${this.state.availableServers.length}`;

    return `${status}\n${cluster}\n${backends}`;
  }

  getServerStatusClass() {
    const clusterAvailability = ExperimentServerService.instance.getClusterAvailability();

    let status = '';
    if (clusterAvailability && clusterAvailability.free > CLUSTER_THRESHOLDS.AVAILABLE) {
      status = 'server-status-available';
    }
    else if (!this.state.availableServers || this.state.availableServers.length === 0) {
      status = 'server-status-unavailable';
    }
    else {
      status = 'server-status-restricted';
    }

    return status;
  }

  render() {
    const exp = this.props.experiment;
    const config = this.props.experiment.configuration;
    const pageState = this.props.pageState;  //TODO: to be removed, migrate to services

    return (
      <div className='list-entry-wrapper flex-container left-right'
        style={{ position: 'relative' }}
        onClick={() => this.setState({ selected: true})}
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
          </div>}

          {this.state.selected &&
          <div className='list-entry-buttons flex-container' onClick={() => {
            return exp.id === pageState.selected;
          }}>
            <div className='btn-group' role='group' >
              {this.canLaunchExperiment && this.state.availableServers.length > 0 &&
                exp.configuration.experimentFile && exp.configuration.bibiConfSrc
                ? <button onClick={() => {
                  ExperimentExecutionService.instance.startNewExperiment(exp, false);
                }}
                //TODO: adjust disabled state to be reactive
                disabled={this.state.experimentStarting /*|| pageState.deletingExperiment*/}
                className='btn btn-default' >
                  <i className='fa fa-plus'></i> Launch
                </button>
                : null}

              {this.canLaunchExperiment && this.state.availableServers.length === 0
                ? <button disabled={this.canLaunchExperiment && this.state.availableServers.length === 0}
                  className='btn btn-default disabled enable-tooltip'
                  title='Sorry, no available servers.'>
                  <i className='fa fa-plus'></i> Launch
                </button>
                : null}

              {this.canLaunchExperiment && config.brainProcesses > 1 &&
                this.state.availableServers.length > 0 &&
                exp.configuration.experimentFile && exp.configuration.bibiConfSrc

                ? <button className='btn btn-default'>
                  <i className='fa fa-plus'></i> Launch in Single Process Mode
                </button>
                : null}

              {this.canLaunchExperiment && this.state.availableServers.length > 1 &&
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
          </div>}
        </div>
      </div>
    );
  }
}
