import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';

export async function getPartyByUserId(userId: string, leader?: boolean) {
	const party = await prisma.party.findFirst({
		where: { members: { some: { userId, leader } } },
		include: {
			queue: true,
		},
	});

	if (!party) {
		throw error(404, 'Party not found');
	}

	return party;
}
