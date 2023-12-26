import type { PageServerLoad } from './$types';
import { getConfig } from '$lib/config';
import { pteroAdmin, pteroUser } from '$lib/pterodactyl';

export const load: PageServerLoad = async () => {
	const configs = await getConfig();

	const server = await pteroUser.getClientServer('1');
	const state = await server.powerState();

	console.log(state);

	return { configs };
};
