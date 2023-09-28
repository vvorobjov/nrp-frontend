//import mqtt from 'mqtt'
import React from 'react';

var mqtt = require('mqtt');


/**
 * This should connect to the experiment datastream via MQTT
 * localhost:[port]/nrp_simulation/[experiment_id]_data0/data
 * 
 * The list of all the topic should be available at 
 * localhost:[port]/nrp_simulation/[experiment_id]_data0/data/topic_list
*/
export default class TopicSub extends React.Component {
    constructor(){
        this.client = mqtt.connect('mqtt://test.mosquitto.org');
    }

    state = { 
        prefix: '',
        topic: '',
        connected: false,
        message: ''
    }
    
   // var client = mqtt.connect('mqtt://test.mosquitto.org');

    this.mqttClient.on('connect', () => {
        console.log("Connection established successfully!");
    });

    // Subscribe to the topic
    //const prefix = "localhost:8883/nrp/experiment/data";
    //const topic = prefix + "/topic_list";
    const prefix = 'localhost:8883/nrp_simulation/husky_simulation_data0/data';
    const topic = prefix + "/topic_list";


    let message = 'empty message';

    this.mqttClient.on('connect', () => {
        mqttClient.subscribe(topic);
    });

    this.mqttClient.on('message',(topic, message) => {
        console.log(`message: ${message}, topic: ${topic}`); 
    });


    // error handling
    this.mqttClient.on('error',(error) => {
        console.error(error);
        process.exit(1);
    });


    render() { 
        return ();
    }

    return (this.mqttClient);
}