import React from 'react';
import 'react-tabs/style/react-tabs.css';


import MqttClientService from '../../services/mqtt-client-service';

import Typography from '@material-ui/core/Typography';

import './experiment-time-box.css';

export default class ExperimentTimeBox extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      timeToken: null
    };
  }

  async componentDidMount() {
    if (this.state.timeToken === null) {
      const timeTopic = MqttClientService.instance.getConfig().mqtt.topics.base + '/'
        + MqttClientService.instance.getConfig().mqtt.topics.time;
      var timeToken = MqttClientService.instance.subscribeToTopic(timeTopic, this.updateTime);
      this.setState({ timeToken: timeToken});
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
