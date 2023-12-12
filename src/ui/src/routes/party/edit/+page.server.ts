import { getUserId } from '$lib/auth';
import { prisma } from '@matchmaker/common';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { emitPartyUpdate } from '$lib/events';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = await getUserId(locals);

	const party = await prisma.party.findFirst({
		where: { members: { some: { userId, leader: true } } },
		select: {
			name: true,
		},
	});
	if (!party) {
		throw error(404, 'Party not found');
	}

	return { party };
};

export const actions: Actions = {
	async updateParty({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const name = data.get('name') as string | null;
		if (!name) {
			throw error(400, 'Party name is missing');
		}

		const party = await prisma.party.findFirst({
			where: { members: { some: { userId, leader: true } } },
		});
		if (!party) {
			throw error(404, 'Party not found');
		}

		await prisma.party.update({
			where: party,
			data: { name },
		});

		emitPartyUpdate(party.id);
	},
};
