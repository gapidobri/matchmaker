import { browser } from '$app/environment';
import { io } from 'socket.io-client';

export const socket = io('ws://localhost:3000', {
	transports: ['websocket'],
	withCredentials: true,
	autoConnect: false,
});

if (browser) {
	socket.connect();
}

socket.on('connect', () => {
	console.log('Connected to websocket server');
});
