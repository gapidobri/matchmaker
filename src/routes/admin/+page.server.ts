import type { PageServerLoad } from './$types';
import { getConfig } from '$lib/config';
import { pteroUser } from '$lib/pterodactyl';

export const load: PageServerLoad = async () => {
	const configs = await getConfig();

	const res = await pteroUser.call(
		`/client/servers/c05aceff-6d50-4803-8d05-241f1ee97ae4/resources`,
		'GET',
		null,
	);

	console.log(res.data.attributes.current_state);

	return { configs };
};
