import { reconnectWebSockets } from '$lib/pterodactyl/websocket';

reconnectWebSockets();

export { handle } from './auth';
