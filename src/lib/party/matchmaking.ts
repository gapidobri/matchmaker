import { emitMatchUpdate } from '$lib/events';
import { getGame } from '$lib/game';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { createServer } from '$lib/pterodactyl/server';
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

	await createServer(match);
}

export async function createTeams(gameId: string) {
	const parties = await prisma.party.findMany({
		where: { queue: { gameId } },
		include: { members: true },
		orderBy: { queue: { createdAt: 'desc' } },
	});

	const config = await getGame(gameId);
	if (!config) {
		logger.error(`Game ${gameId} not found`);
		return { teams: [], parties: [] };
	}

	// TODO: Check minTeams and maxTeams, don't split same party into multiple games

	const teams: PartyMember[][] = [];
	const usedParties: Party[] = [];

	for (const party of parties) {
		// Split one party into multiple teams
		if (party.members.length > config?.max_team_size) {
			const teamCount = party.members.length / config.max_team_size;
			const newTeams: PartyMember[][] = Array.from({ length: teamCount }, () => []);

			party.members.forEach((member, i) => {
				const teamIndex = Math.floor(i / teamCount);
				newTeams[teamIndex].push(member);
			});

			teams.push(...newTeams);
			usedParties.push(...parties.splice(parties.indexOf(party), 1));
			continue;
		}

		// Join two parties
		if (party.members.length < config.min_team_size) {
			parties.splice(parties.indexOf(party), 1);
			usedParties.push(party);
			let remaining = config.max_team_size - party.members.length;
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

			if (team.length >= config.min_team_size) {
				teams.push(team);
				usedParties.push(party);
			}
			continue;
		}

		teams.push(party.members);
		usedParties.push(party);

		if (teams.length >= config.max_teams) {
			break;
		}
	}

	if (teams.length < config.min_teams) {
		return { teams: [], parties: [] };
	}

	return { teams, parties: usedParties };
}
