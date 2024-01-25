import type { PageServerLoad } from './$types';
import { getConfig } from '$lib/config';
import { pteroUser } from '$lib/pterodactyl/client';
import { WebSocket } from 'ws';

export const load: PageServerLoad = async () => {
	const configs = await getConfig();

	return { configs };
};
