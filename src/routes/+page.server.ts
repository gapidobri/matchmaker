import { getUserId } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { emitPartyUpdate, emitUpdateForAll } from '$lib/events';
import { getConfig } from '$lib/config';
import { getGame } from '$lib/game';
import { getPartyByUserId, leaveParty } from '$lib/party/party';
import { processQueues } from '$lib/party/matchmaking';
import { cleanupTeams } from '$lib/team';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = await getUserId(locals);

	const partyMember = await prisma.partyMember.findFirst({
		where: { userId },
		include: { team: { include: { match: { include: { server: true } } } } },
	});
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
			queue: true,
		},
	});

	const expectedPlayerCount = await prisma.partyMember.count({
		where: {
			team: {
				matchId: partyMember.team?.matchId,
			},
		},
	});

	const config = await getConfig();

	const games = await Promise.all(
		config.map(async (game) => {
			const count = await prisma.partyMember.count({
				where: { party: { queue: { gameId: game.id } } },
			});
			return {
				id: game.id,
				name: game.name,
				min_team_size: game.min_team_size,
				min_teams: game.min_teams,
				playerCount: count,
			};
		}),
	);

	return {
		party,
		leader: partyMember.leader,
		games,
		match: partyMember.team?.match,
		expectedPlayerCount,
	};
};

export const actions: Actions = {
	// joinParty joins a user to a party by code
	async joinParty({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const code = data.get('code') as string | null;
		if (!code) {
			error(400, 'Party code is missing');
		}

		const party = await prisma.party.findUnique({ where: { code } });
		if (!party) {
			return { success: false, message: 'Party not found' };
		}

		await prisma.party.update({
			where: party,
			data: { joinRequests: { connect: { id: userId } } },
		});

		await emitPartyUpdate(party.id);

		return { success: true, message: 'Join request sent' };
	},

	// leaveParty removes a user from a party
	async leaveParty({ locals }) {
		const userId = await getUserId(locals);
		await leaveParty(userId);
	},

	// acceptJoin accepts a join request from a user
	async acceptJoin({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const joiningUserId = data.get('userId') as string | null;
		if (!joiningUserId) {
			error(400, 'User ID is missing');
		}

		// Find party where the user is leader and joining user has requested to join
		const party = await prisma.party.findFirst({
			where: {
				members: { some: { userId, leader: true } },
				joinRequests: { some: { id: joiningUserId } },
			},
		});
		if (!party) {
			error(404, 'Party not found');
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

		emitPartyUpdate(party.id);
	},

	// declineJoin declines a join request from a user
	async declineJoin({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const joiningUserId = data.get('userId') as string | null;
		if (!joiningUserId) {
			error(400, 'User ID is missing');
		}

		const party = await prisma.party.findFirst({
			where: {
				members: { some: { userId, leader: true } },
				joinRequests: { some: { id: joiningUserId } },
			},
		});
		if (!party) {
			error(404, 'Party not found');
		}

		await prisma.party.update({
			where: party,
			data: {
				joinRequests: { disconnect: { id: joiningUserId } },
			},
		});

		emitPartyUpdate(party.id);
	},

	// kickMember kicks a member from the party
	async kickMember({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const memberId = data.get('userId') as string | null;
		if (!memberId) {
			error(400, 'User ID is missing');
		}

		if (userId === memberId) {
			error(400, 'Cannot kick yourself');
		}

		const partyMember = await prisma.partyMember.delete({
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

		emitPartyUpdate(partyMember.partyId, memberId);
	},

	async joinQueue({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const gameId = data.get('gameId') as string | null;
		if (!gameId) error(400, 'Game ID is missing');

		const party = await getPartyByUserId(userId, true);

		const game = await getGame(gameId);
		if (!game) error(404, 'Game not found');

		await prisma.queue.create({
			data: {
				partyId: party.id,
				gameId: game.id,
			},
		});

		await emitUpdateForAll();

		await processQueues(gameId);
	},

	async leaveQueue({ locals }) {
		const userId = await getUserId(locals);

		const party = await getPartyByUserId(userId, true);
		if (!party.queue) {
			error(400, 'Party is not in queue');
		}

		await prisma.queue.delete({
			where: {
				partyId_gameId: {
					partyId: party.id,
					gameId: party.queue.gameId,
				},
			},
		});

		await emitUpdateForAll();
	},

	async leaveMatch({ locals }) {
		const userId = await getUserId(locals);

		const party = await getPartyByUserId(userId, true);
		if (!party) {
			error(404, 'Party not found');
		}

		await prisma.partyMember.updateMany({
			where: { partyId: party.id },
			data: { teamId: null },
		});

		await emitPartyUpdate(party.id);

		await cleanupTeams();
	},
};
