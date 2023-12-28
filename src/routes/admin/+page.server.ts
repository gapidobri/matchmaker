import type { PageServerLoad } from './$types';
import { getConfig } from '$lib/config';
import { pteroUser } from '$lib/pterodactyl';
import { WebSocket } from 'ws';

export const load: PageServerLoad = async () => {
	const configs = await getConfig();

	const res = await pteroUser.call(
		`/client/servers/1949c3e6-0c15-44ec-8e80-50f7db1d6f20/websocket`,
		'GET',
		null,
	);

	const socket = new WebSocket(res.data.socket, {});
	socket.on('open', () => {
		const data = {
			event: 'auth',
			args: [res.data.token],
		};
		socket.send(JSON.stringify(data));
	});

	socket.on('message', async (json) => {
		const data = JSON.parse(json.toString());
		switch (data.event) {
			case 'token expiring':
				pteroUser
					.call(`/client/servers/1949c3e6-0c15-44ec-8e80-50f7db1d6f20/websocket`, 'GET', null)
					.then((res) => {
						const data = {
							event: 'auth',
							args: [res.data.token],
						};
						socket.send(JSON.stringify(data));
					});
				break;
			case 'stats':
				break;
			default:
				console.log(data);
		}
	});

	return { configs };
};
