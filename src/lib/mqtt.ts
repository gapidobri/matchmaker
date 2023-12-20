import { connect } from 'mqtt';

export const mqtt = connect('mqtt://localhost:1883');

mqtt.on('connect', () => {
	console.log('Connected to MQTT broker');
});
