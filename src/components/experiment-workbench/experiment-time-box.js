import React from 'react';
import 'react-tabs/style/react-tabs.css';


import MqttClientService from '../../services/mqtt-client-service';
import ExperimentWorkbenchService from './experiment-workbench-service';

import Typography from '@material-ui/core/Typography';

import './experiment-time-box.css';

export default class ExperimentTimeBox extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      simulationID: undefined,
      timeToken: null
    };
  }

  async componentDidMount() {
    if (ExperimentWorkbenchService.simulationID === undefined) {
      ExperimentWorkbenchService.instance.addListener(
        ExperimentWorkbenchService.EVENTS.SIMULATION_SET,
        this.setTopic
      );
    }
    else {
      this.setTopic(ExperimentWorkbenchService.simulationID);
    }
  }

  async componentWillUnmount() {
    if (this.state.timeToken) {
      await MqttClientService.instance.unsubscribe(
        this.state.timeTopic
      ).then(() => {
        this.setState({ timeToken: null });
      });
    }
  }

  setTopic = (simulationID) => {
    if (this.state.timeToken) {
      MqttClientService.instance.unsubscribe(this.state.timeToken);
      this.setState({ timeToken: null });
    }
    if (simulationID === undefined) {
      this.setState({ simulationTime: '' });
    }
    else {
      const timeTopic = MqttClientService.instance.getConfig().mqtt.topics.base + '/'
        + simulationID + '/'
        + MqttClientService.instance.getConfig().mqtt.topics.time;
      var timeToken = MqttClientService.instance.subscribeToTopic(timeTopic, this.updateTime);
      this.setState({ timeToken: timeToken });
    }
  }

  updateTime = (msg) => {
    this.setState({ simulationTime: msg.toString()});
  }

  render() {
    return (
      <Typography align='left' variant='subtitle1' color='inherit' noWrap className='experiment-time-box'>
        Simulation Time: {this.state.simulationTime}
      </Typography>
    );
  }
}
