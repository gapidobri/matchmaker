import { emitMatchUpdate } from '$lib/events';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { createServer, startServer } from '$lib/pterodactyl/server';
import type { Party, PartyMember } from '@prisma/client';

export async function processQueues(gameId: string) {
	logger.info(`Processing queues for ${gameId}`);

	const { teams, parties } = await createTeams(gameId);
	if (teams.length === 0) {
		logger.info('No teams found');
		return;
	}

	await prisma.queue.deleteMany({
		where: { partyId: { in: parties.map((p) => p.id) } },
	});

	const match = await prisma.match.create({ data: { gameId } });

	for (const team of teams) {
		await prisma.team.create({
			data: {
				players: { connect: team },
				match: { connect: { id: match.id } },
			},
		});
	}

	await emitMatchUpdate(match.id);

	// Create game server / run commands
	const serverId = await createServer(match);

	await startServer(serverId);

	await prisma.match.update({
		where: { id: match.id },
		data: { status: 'WAIT_FOR_JOIN' },
	});

	await emitMatchUpdate(match.id);

	// Invite players to match
	// Start match
}

export async function createTeams(gameId: string) {
	const parties = await prisma.party.findMany({
		where: { queue: { gameId } },
		include: { members: true },
		orderBy: { queue: { createdAt: 'desc' } },
	});

	// TODO: Get from config
	const config = {
		minTeams: 2,
		maxTeams: 4,
		minTeamSize: 2,
		maxTeamSize: 4,
	};

	// TODO: Check minTeams and maxTeams, don't split same party into multiple games

	const teams: PartyMember[][] = [];
	const usedParties: Party[] = [];

	for (const party of parties) {
		if (party.members.length > config.maxTeamSize) {
			const teamCount = party.members.length / config.maxTeamSize;
			const newTeams: PartyMember[][] = Array.from({ length: teamCount }, () => []);

			party.members.forEach((member, i) => {
				newTeams[i % teamCount].push(member);
			});

			teams.push(...newTeams);
			usedParties.push(...parties.splice(parties.indexOf(party), 1));
			continue;
		}

		if (party.members.length < config.minTeamSize) {
			parties.splice(parties.indexOf(party), 1);
			usedParties.push(party);
			let remaining = config.maxTeamSize - party.members.length;
			const team = party.members;
			for (const party of parties) {
				if (remaining === 0) break;
				if (party.members.length <= remaining) {
					team.push(...party.members);
					remaining -= party.members.length;
					parties.splice(parties.indexOf(party), 1);
					usedParties.push(party);
				}
			}

			if (team.length >= config.minTeamSize) {
				teams.push(team);
				usedParties.push(party);
			}
			continue;
		}

		teams.push(party.members);
		usedParties.push(party);
	}

	return { teams, parties: usedParties };
}
