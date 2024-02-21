import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';
import { isAdmin } from '$lib/auth';
import { error } from '@sveltejs/kit';
import { deleteMatch, startMatch } from '$lib/match';
import { deleteServer } from '$lib/pterodactyl/server';

export const load: PageServerLoad = async () => {
	const [parties, matches, servers] = await Promise.all([
		prisma.party.findMany({
			include: { queue: true },
		}),
		prisma.match.findMany({
			include: {
				teams: { include: { players: true } },
				server: true,
			},
		}),
		prisma.server.findMany(),
	]);

	return { parties, matches, servers };
};

async function checkAdmin(locals: App.Locals) {
	if (!(await isAdmin(locals))) {
		error(403, 'Forbidden');
	}
}

export const actions: Actions = {
	async startMatch({ locals, request }) {
		await checkAdmin(locals);

		const data = await request.formData();

		const matchId = data.get('matchId') as string | null;
		if (!matchId) {
			error(400, 'Match ID is required');
		}

		await startMatch(matchId);
	},
	async deleteMatch({ locals, request }) {
		await checkAdmin(locals);

		const data = await request.formData();

		const matchId = data.get('matchId') as string | null;
		if (!matchId) {
			error(400, 'Match ID is required');
		}

		await deleteMatch(matchId);
	},
	async deleteServer({ locals, request }) {
		await checkAdmin(locals);

		const data = await request.formData();

		const serverId = data.get('serverId') as string | null;
		if (!serverId) {
			error(400, 'Server ID is required');
		}

		await deleteServer(serverId);
	},
};
