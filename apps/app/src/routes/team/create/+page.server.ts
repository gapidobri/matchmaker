import { prisma } from '$lib/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getUserId } from '$lib/auth';

export const actions: Actions = {
	async createTeam({ request, locals }) {
		const userId = await getUserId(locals);

		if (await prisma.teamMember.count({ where: { userId } })) {
			throw error(400, 'You are already in a team');
		}

		const data = await request.formData();

		const name = data.get('name') as string | null;
		if (!name) {
			throw error(400, 'Team name is missing');
		}

		await prisma.team.create({
			data: {
				name,
				code: (Math.random() + 1).toString(36).substring(7),
				members: {
					create: {
						userId,
						leader: true,
					},
				},
			},
		});

		throw redirect(301, '/');
	},
};
