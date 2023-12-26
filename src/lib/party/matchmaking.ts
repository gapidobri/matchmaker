import { PTERODACTYL_USER_ID } from '$env/static/private';
import { getGame } from '$lib/game';
import { prisma } from '$lib/prisma';
import { pteroAdmin } from '$lib/pterodactyl';
import type { PartyMember } from '@prisma/client';

export async function processQueues(gameId: string) {
	const teams = await createTeams(gameId);
	if (teams.length === 0) return;

	const match = await prisma.match.create({ data: { gameId } });

	// TODO: Remove parties from queue

	await prisma.team.createMany({
		data: teams.map((members) => ({
			matchId: match.id,
			members: { connect: members },
			match: { connect: { id: match.id } },
		})),
	});

	// Create game server / run commands
	const serverId = await createServer(gameId, match.id);

	await prisma.match.update({
		where: { id: match.id },
		data: { serverId },
	});

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

	for (const party of parties) {
		if (party.members.length > config.maxTeamSize) {
			const teamCount = party.members.length / config.maxTeamSize;
			const newTeams: PartyMember[][] = Array.from({ length: teamCount }, () => []);

			party.members.forEach((member, i) => {
				newTeams[i % teamCount].push(member);
			});

			teams.push(...newTeams);
			parties.splice(parties.indexOf(party), 1);
			continue;
		}

		if (party.members.length < config.minTeamSize) {
			parties.splice(parties.indexOf(party), 1);
			let remaining = config.maxTeamSize - party.members.length;
			const team = [...party.members];
			for (const party of parties) {
				if (remaining === 0) break;
				if (party.members.length <= remaining) {
					team.push(...party.members);
					remaining -= party.members.length;
					parties.splice(parties.indexOf(party), 1);
				}
			}

			if (team.length >= config.minTeamSize) {
				teams.push(team);
			}
			continue;
		}

		teams.push(party.members);
	}

	return teams;
}

export async function createServer(gameId: string, name: string) {
	// Get node with least servers
	const servers = await pteroAdmin.getServers();

	const nodeServerCount = new Map<number, number>();
	for (const server of servers) {
		const count = nodeServerCount.get(server.node) ?? 0;
		nodeServerCount.set(server.node, count + 1);
	}

	const nodeId = [...nodeServerCount.entries()].sort((a, b) => a[1] - b[1])[0][0];
	const node = await pteroAdmin.getNode(nodeId.toString());

	// Get free allocation
	const allocations = await node.getAllocations();
	const allocation = allocations.find((a) => !a.assigned);
	if (!allocation) {
		throw new Error('No free allocations');
	}

	// Create server
	const game = await getGame(gameId);

	const server = await pteroAdmin.createServer({
		...game.deployment.data,
		name: `${game.id}-${name}`,
		user: Number(PTERODACTYL_USER_ID),
		image: game.deployment.data.docker_image,
		featureLimits: {
			databases: 0,
			allocations: 0,
			backups: 0,
			split_limit: 0,
		},
		allocation: {
			default: allocation?.id,
			additional: [],
		},
	});

	return server.id.toString();
}
