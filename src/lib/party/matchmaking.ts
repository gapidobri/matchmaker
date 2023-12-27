import { PTERODACTYL_USER_ID } from '$env/static/private';
import { emitMatchUpdate } from '$lib/events';
import { getGame } from '$lib/game';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { pteroAdmin, pteroUser } from '$lib/pterodactyl';
import { MatchStatus, type Match, type Party, type PartyMember } from '@prisma/client';

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
		data: { status: MatchStatus.WAIT_FOR_JOIN },
	});

	await emitMatchUpdate(match.id);

	// Invite players to match
	// Start match
}

async function startServer(serverId: string) {
	logger.info(`Starting server ${serverId}`);

	let sentStart = false;
	return new Promise<void>((resolve) => {
		const interval = setInterval(async () => {
			try {
				const res = await pteroUser.call(`/client/servers/${serverId}/resources`, 'GET', null);
				const state = res.data.attributes.current_state;
				logger.debug(`Server ${serverId} state: ${state}`);
				switch (state) {
					case 'offline':
						if (sentStart) break;
						await pteroUser.getClientServer(serverId).then((s) => s.start());
						sentStart = true;
						break;
					case 'running':
						logger.info(`Server ${serverId} started`);
						clearInterval(interval);
						resolve();
				}
			} catch (e) {
				logger.debug(`Server ${serverId} state: installing`);
			}
		}, 2000);
	});
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

export async function createServer(match: Match) {
	logger.info(`Creating server for ${match.gameId}`);

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
	const game = await getGame(match.gameId);

	const { environment } = game.deployment.data;

	let password: string | undefined;

	if (game.password === true) {
		password = Math.random().toString(36).slice(-8);

		for (const key in environment) {
			environment[key] = environment[key].toString().replaceAll('${PASSWORD}', password);
		}
	}

	const server = await pteroAdmin.createServer({
		...game.deployment.data,
		environment,
		name: `${game.id}-${match.id}`,
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

	await prisma.server.create({
		data: {
			id: server.uuid,
			password,
			ip: allocation.ip,
			port: allocation.port,
			match: { connect: { id: match.id } },
		},
	});

	return server.uuid;
}
