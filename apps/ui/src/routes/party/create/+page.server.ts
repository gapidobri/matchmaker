import { prisma } from '$lib/prisma';
import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getUserId } from '$lib/auth';

export const actions: Actions = {
	async createParty({ request, locals }) {
		const userId = await getUserId(locals);

		if (await prisma.partyMember.count({ where: { userId } })) {
			throw error(400, 'You are already in a party');
		}

		const data = await request.formData();

		const name = data.get('name') as string | null;
		if (!name) {
			throw error(400, 'Party name is missing');
		}

		await prisma.party.create({
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
