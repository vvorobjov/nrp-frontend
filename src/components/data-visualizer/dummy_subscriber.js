
import mqtt from 'mqtt';

const createMqttClient = () => {
  const client = mqtt.connect('mqtt://broker.example.com');

  client.on('connect', () => {
    console.log('MQTT connected');
  });

  client.on('message', (topic, message) => {
    console.log(`Received message: ${message.toString()} on topic ${topic}`);
  });

  return client;
};

export default createMqttClient;