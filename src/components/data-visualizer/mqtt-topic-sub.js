
import mqtt from 'mqtt';
import React from 'react';

export default class TopicSub extends React.Component {
  constructor(){
    console.log('topic sub created');
  }
  client =  mqtt.connect('mqtt://test.mosquitto.org');
  render(){
    return(<div>SUB</div>);
  }
}