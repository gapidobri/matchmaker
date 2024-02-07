import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import type { Match } from '@prisma/client';
import { env } from '$env/dynamic/private';
import { connectToWebSocket } from './websocket';
import { getGame } from '$lib/game';
import { pteroAdmin, pteroUser } from './client';
import { getConfig } from '$lib/config';

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
	if (!game) {
		throw new Error(`Game with id ${match.gameId} not found`);
	}

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
		game.deployment.data.nest, // nestId
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

	const dbServer = await prisma.server.create({
		data: {
			pterodactylId: server.id,
			pterodactylUuid: server.uuid,
			connectionString,
			match: { connect: { id: match.id } },
		},
	});

	await connectToWebSocket(dbServer.id);

	return server.uuid;
}

export async function startServer(serverId: string) {
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

export async function deleteServer(serverId: string) {
	logger.info(`Deleting server ${serverId}`);

	const server = await prisma.server.findUnique({ where: { id: serverId } });
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	await pteroAdmin.deleteServer(server.pterodactylId);

	await prisma.server.delete({ where: { id: serverId } });
}

export async function sendStartGameCommand(serverId: string) {
	logger.info(`Sending start game command to server ${serverId}`);

	const server = await prisma.server.findUnique({
		where: { id: serverId },
		include: { match: true },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	const config = await getConfig();
	const gameConfig = config.find((game) => game.id === server.match.gameId);
	if (!gameConfig) {
		logger.error(`Game with id ${server.match.gameId} not found`);
		return;
	}

	if (!gameConfig.start_game_command) {
		logger.error(`Game with id ${server.match.gameId} does not have a start command`);
		return;
	}

	await pteroUser.sendCommand(server.pterodactylUuid, gameConfig.start_game_command);
}
