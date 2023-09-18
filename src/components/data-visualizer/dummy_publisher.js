const mqtt = require('mqtt');

const brokerUrl = 'mqtt://broker.example.com'; // Replace with your MQTT broker URL
const topic = 'my-topic'; // Replace with the desired topic

// Create the MQTT client
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Function to publish a message
function publishMessage(message) {
  client.publish(topic, message, (err) => {
    if (err) {
      console.error('Error publishing message:', err);
    } else {
      console.log('Message published:', message);
    }
  });
}

// Example usage
publishMessage('Hello, MQTT!');