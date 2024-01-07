import { env } from '$env/dynamic/private';
import { emitMatchUpdate } from '$lib/events';
import { getGame } from '$lib/game';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { pteroAdmin, pteroUser } from '$lib/pterodactyl';
import type { Match, Party, PartyMember } from '@prisma/client';

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

async function startServer(serverId: string) {
	logger.info(`Starting server ${serverId}`);

	let sentStart = false;
	return new Promise<void>((resolve) => {
		const interval = setInterval(async () => {
			try {
				const resources = await pteroUser.getServerResources(serverId);
				const state = resources.current_state;
				logger.debug(`Server ${serverId} state: ${state}`);
				switch (state) {
					case 'offline':
						if (sentStart) break;
						await pteroUser.setPowerState(serverId, 'start');
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
	const servers = await pteroAdmin.getAllServers();

	const allowedNodes = env.PTERODACTYL_ALLOWED_NODES.split(',').map(Number);

	const nodeServerCount = new Map<number, number>();
	for (const server of servers) {
		if (!allowedNodes.includes(server.attributes.node)) continue;
		const count = nodeServerCount.get(server.attributes.node) ?? 0;
		nodeServerCount.set(server.attributes.node, count + 1);
	}

	// TODO: Get allowed nodes from config
	const nodeId = [...nodeServerCount.entries()].sort((a, b) => a[1] - b[1])[0][0];

	// Get free allocation
	const allocations = await pteroAdmin.getAllAllocations(nodeId);
	const allocation = allocations.find((a) => !a.attributes.assigned);
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

	const server = await pteroAdmin.createServer(
		`${game.id}-${match.id}`, // name
		Number(env.PTERODACTYL_USER_ID), // ownerId
		'', // description
		0, // nestId
		game.deployment.data.egg, // eggId
		allocation.attributes.id, // defaultAllocationId
		undefined, // addAllocationIds
		environment, // environment
		game.deployment.data.limits.cpu, // cpu
		game.deployment.data.limits.memory, // ram
		game.deployment.data.limits.disk, // disk
		0, // databaseLimit
		0, // allocationLimit
		0, // backupLimit
		game.deployment.data.startup, // startupCmd
		game.deployment.data.docker_image, // dockerImage
		game.deployment.data.limits.swap, // swap
		game.deployment.data.limits.io, // io
		true, // startOnCompletion
	);

	const connectionString = `steam://connect/${allocation.attributes.ip}:${
		allocation.attributes.port
	}${password ? '/' + password : ''}`;

	await prisma.server.create({
		data: {
			id: server.uuid,
			connectionString,
			match: { connect: { id: match.id } },
		},
	});

	return server.uuid;
}
