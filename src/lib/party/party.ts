import { emitPartyUpdate } from '$lib/events';
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
		error(404, 'Party not found');
	}

	return party;
}

export async function leaveParty(userId: string) {
	const { partyId } = await prisma.partyMember.delete({
		where: { userId },
	});

	const newLeader = await prisma.partyMember.findFirst({
		where: { partyId },
	});
	if (!newLeader) {
		await prisma.party.delete({ where: { id: partyId } });
		return;
	}
	await prisma.partyMember.update({
		where: newLeader,
		data: { leader: true },
	});

	await emitPartyUpdate(partyId);
}
