
import mqtt from 'mqtt';
import React from 'react';

export default class TopicPub extends React.Component {
  constructor(){
    console.log('topic pub created');
  }
  client =  mqtt.connect('mqtt://test.mosquitto.org');
  render(){
    return(<div>SUB</div>);
  }
}