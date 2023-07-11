import React from 'react';
import 'react-tabs/style/react-tabs.css';

import ExperimentWorkbenchService from './experiment-workbench-service';
import timeDDHHMMSS from '../../utility/time-filter';

import Typography from '@material-ui/core/Typography';

import './experiment-time-box.css';

/**
 * The component displaying the simulation time in the experiment workbench
 */
export default class ExperimentTimeBox extends React.Component {

  constructor(props) {
    super(props);

    this.type = props.value;
    switch (this.type) {
    case 'real':
      this.title = 'Real Time: ';
      break;
    case 'experiment':
      this.title = 'Simulation Time: ';
      break;
    case 'remaining':
      this.title = 'Simulation Time Left: ';
      break;
    default:
      this.title = 'Unknown: ';
      break;
    }
    this.state = {
      timeToken: null,
      simulationTime: undefined
    };
  }

  async componentDidMount() {
    ExperimentWorkbenchService.instance.addListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.updateTimeHandler
    );
  }

  async componentWillUnmount() {
    ExperimentWorkbenchService.instance.removeListener(
      ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED,
      this.updateTimeHandler
    );
  }

  /**
   * The handler updating the simulation time from the simulation status
   *
   * @callback ExperimentWorkbenchService.EVENTS.SIMULATION_STATUS_UPDATED
   *
   * @param {object} status is an object representing the simulation status
   * @param {float}  status.realTime is the real time of the simulation
   * @param {float}  status.simulationTime is the simulation time of the simulation
   * @param {string} status.state is the simulation state
   * @param {float}  status.simulationTimeLeft is the time left until timeout
   */
  updateTimeHandler = (status) => {
    switch (this.type) {
    case 'real':
      this.setState({ simulationTime: status.realTime.toString()});
      return;
    case 'experiment':
      this.setState({ simulationTime: status.simulationTime.toString()});
      return;
    case 'remaining':
      this.setState({ simulationTime: status.simulationTimeLeft.toString()});
      return;
    default:
      this.setState({ simulationTime: undefined});
      return;
    }
  }

  render() {
    return (
      <Typography align='left' variant='subtitle1' color='inherit' noWrap className='experiment-time-box'>
        {this.title}{timeDDHHMMSS(parseFloat(this.state.simulationTime))}
      </Typography>
    );
  }
}
