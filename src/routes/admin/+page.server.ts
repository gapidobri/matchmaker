import type { PageServerLoad } from './$types';
import { getConfig } from '$lib/config';
import { pterodactyl } from '$lib/pterodactyl';

export const load: PageServerLoad = async () => {
	const configs = await getConfig();
	const node = await pterodactyl.getNode('1');
	const allocations = await node.getAllocations();

	return { configs, allocations: allocations.map((a) => a.toJSON()) };
};
