import React from 'react';
import { FaStop } from 'react-icons/fa';
import { ImEnter } from 'react-icons/im';
import { withRouter } from 'react-router-dom';

import timeDDHHMMSS from '../../utility/time-filter.js';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';
import ExperimentWorkbenchService from '../experiment-workbench/experiment-workbench-service';
import ServerResourcesService from '../../services/experiments/execution/server-resources-service.js';

import './simulation-details.css';

class SimulationDetails extends React.Component {
  constructor() {
    super();

    this.state = {
      simUptimes: [],
      titleButtonShutdown: '',
      shutdownDisabled: false
    };
  }

  componentDidMount() {
    this.updateSimUptimes();
    this.intervalUpdateSimUptimes = setInterval(() => {
      this.updateSimUptimes();
    }, 1000);
  }

  componentWillUnmount() {
    this.intervalUpdateSimUptimes && clearInterval(this.intervalUpdateSimUptimes);
  }

  isJoinDisabled(simulation) {
    return simulation.runningSimulation.state === EXPERIMENT_STATE.CREATED ||
      this.state.shutdownDisabled;
  }

  updateSimUptimes() {
    this.setState({
      simUptimes: this.props.simulations.map(sim => {
        return (Date.now() - Date.parse(sim.runningSimulation.creationDate)) / 1000;
      })
    });
  }

  /**
   * Join the running simulation.
   * @param {object} simulationInfo the description of the running simulation
   *
   * Opens experiment workbench and sets the running simulation ID in ExperimentWorkbenchService
   */
  joinSimulation(simulationInfo) {
    ExperimentWorkbenchService.instance.simulationInfo = {
      ID: simulationInfo.runningSimulation.simulationID,
      MQTTPrefix: simulationInfo.runningSimulation.MQTTPrefix
    };
    ServerResourcesService.instance.getServerConfig(simulationInfo.server).then((serverConfig) => {
      ExperimentWorkbenchService.instance.serverURL = serverConfig['nrp-services'];
      this.props.history.push({
        pathname: '/experiment/' + simulationInfo.runningSimulation.experimentID
      });
    });
  }

  render() {
    return (
      <div className='simulations-details-wrapper'>
        <div className='table-row table-header'>
          <div>Server</div>
          <div>Creator</div>
          <div>Uptime</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {this.props.simulations.map((simulation, index) => {
          return (
            <div key={simulation.runningSimulation.simulationID} className='table-row'>
              <div>{simulation.server}</div>
              <div>{simulation.runningSimulation.owner}</div>
              <div>{timeDDHHMMSS(this.state.simUptimes[index])}</div>
              <div>{simulation.runningSimulation.state}</div>
              <div>
                {/* Join button enabled provided simulation state is consistent */}
                <button /*analytics-on analytics-event="Join" analytics-category="Experiment"
                  ng-click="(simulation.runningSimulation.state === STATE.CREATED) ||
                    simulation.stopping || joinExperiment(simulation, exp);"*/
                  type="button" className='nrp-btn btn-default'
                  disabled={this.isJoinDisabled(simulation)}
                  onClick={() => {
                    this.joinSimulation(simulation);
                  }}>
                  <ImEnter className='icon' />Join
                </button>
                {/* Shutdown button enabled provided simulation state is consistent */}
                <button
                  onClick={async () => {
                    this.setState({ shutdownDisabled: true });
                    try {
                      await ExperimentExecutionService.instance.shutdownExperiment(simulation);
                      this.setState({ shutdownDisabled: false });
                    }
                    catch (err) {
                      this.setState({ shutdownDisabled: false });
                      console.error(err.toString());
                    };
                  }}
                  type="button" className='nrp-btn btn-default'
                  disabled={this.state.shutdownDisabled}
                  title={this.state.titleButtonShutdown}>
                  <FaStop className='icon' />Shutdown
                </button>
              </div>
            </div>
          );
        })
        }

        {/* TODO: [NRRPLT-8773] Add Stop All button */}
        {/* <div className='table-row'>
          <div className='table-column-last'>
            <button className='nrp-btn btn-default'>
              <FaStopCircle className='icon' />Stop All
            </button>
          </div>
        </div> */}
      </div >
    );
  }
}
export default withRouter(SimulationDetails);
