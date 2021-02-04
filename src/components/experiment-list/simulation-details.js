import React from 'react';
import { FaStop, FaStopCircle } from 'react-icons/fa';
import { ImEnter } from 'react-icons/im';

import timeDDHHMMSS from '../../utility/time-filter.js';
import { EXPERIMENT_STATE } from '../../services/experiments/experiment-constants.js';
import ExperimentExecutionService from '../../services/experiments/execution/experiment-execution-service.js';

import './simulation-details.css';

export default class SimulationDetails extends React.Component {
  constructor() {
    super();

    this.state = {
      simUptimes: [],
      titleButtonStop: ''
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
      simulation.stopping;
  }

  isStopDisabled(simulation) {
    let disabled = simulation.stopping;
    if (disabled) {
      this.titleButtonStop = 'Sorry, you don\'t have sufficient rights to stop the simulation.';
    }
    else {
      this.titleButtonStop = '';
    }

    return disabled;
  }

  updateSimUptimes() {
    this.setState({
      simUptimes: this.props.simulations.map(sim => {
        return (Date.now() - Date.parse(sim.runningSimulation.creationDate)) / 1000;
      })
    });
  }

  render() {
    //console.info(this.props.simulations);
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
                  type="button" className="btn btn-default"
                  disabled={this.isJoinDisabled(simulation)}>
                  <ImEnter className='icon' /> Join
                </button>
                {/* Stop button enabled provided simulation state is consistent */}
                <button /*analytics-on analytics-event="Stop" analytics-category="Experiment"*/
                  onClick={() => ExperimentExecutionService.instance.stopExperiment(simulation)}
                  type="button" className="btn btn-default"
                  disabled={this.isStopDisabled(simulation)}
                  title={this.state.titleButtonStop}>
                  <FaStop className='icon' /> Stop
                </button>
              </div>
            </div>
          );
        })
        }

        <div className='table-row'>
          <button className='table-column-last'>
            <FaStopCircle className='icon' /> Stop All
          </button>
        </div>
      </div >
    );
  }
}
