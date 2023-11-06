import { getUserId } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { emitPartyUpdate } from '$lib/events';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = await getUserId(locals);

	const partyMember = await prisma.partyMember.findFirst({ where: { userId } });
	if (!partyMember) {
		return { party: null };
	}

	const party = await prisma.party.findFirst({
		where: { members: { some: { userId } } },
		include: {
			members: {
				select: {
					leader: true,
					user: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			joinRequests: partyMember.leader && {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return { party, leader: partyMember.leader };
};

export const actions: Actions = {
	// joinParty joins a user to a party by code
	async joinParty({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const code = data.get('code') as string | null;
		if (!code) {
			throw error(400, 'Party code is missing');
		}

		const party = await prisma.party.findUnique({ where: { code } });
		if (!party) {
			return { success: false, message: 'Party not found' };
		}

		await prisma.party.update({
			where: party,
			data: { joinRequests: { connect: { id: userId } } },
		});

		emitPartyUpdate(party.id);
	},

	// leaveParty removes a user from a party
	async leaveParty({ locals }) {
		const userId = await getUserId(locals);

		const { partyId } = await prisma.partyMember.delete({
			where: { userId },
		});

		const newLeader = await prisma.partyMember.findFirst({
			where: { partyId },
		});
		if (!newLeader) {
			return;
		}

		await prisma.partyMember.update({
			where: newLeader,
			data: { leader: true },
		});
	},

	// acceptJoin accepts a join request from a user
	async acceptJoin({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const joiningUserId = data.get('userId') as string | null;
		if (!joiningUserId) {
			throw error(400, 'User ID is missing');
		}

		// Find party where the user is leader and joining user has requested to join
		const party = await prisma.party.findFirst({
			where: {
				members: { some: { userId, leader: true } },
				joinRequests: { some: { id: joiningUserId } },
			},
		});
		if (!party) {
			throw error(404, 'Party not found');
		}

		await prisma.party.update({
			where: party,
			data: {
				// Add user to members of the party
				members: { create: { userId: joiningUserId } },
				// Remove user from join requests
				joinRequests: { disconnect: { id: joiningUserId } },
			},
		});
	},

	// declineJoin declines a join request from a user
	async declineJoin() {},

	// kickMember kicks a member from the party
	async kickMember({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const memberId = data.get('userId') as string | null;
		if (!memberId) {
			throw error(400, 'User ID is missing');
		}

		if (userId === memberId) {
			throw error(400, 'Cannot kick yourself');
		}

		await prisma.partyMember.delete({
			where: {
				userId: memberId,
				party: {
					members: {
						some: {
							userId,
							leader: true,
						},
					},
				},
			},
		});
	},
};
