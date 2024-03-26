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
	const nodes = await pteroAdmin.getAllNodes();

	if (env.PTERODACTYL_ALLOWED_NODES) {
		const allowedNodes = env.PTERODACTYL_ALLOWED_NODES.split(',');
		for (const node of nodes) {
			if (!allowedNodes.includes(node.attributes.id.toString())) {
				nodes.splice(nodes.indexOf(node), 1);
			}
		}
	}

	if (nodes.length === 0) {
		throw new Error('No nodes available');
	}

	const nodeServerCount = new Map<number, number>();

	for (const node of nodes) {
		nodeServerCount.set(node.attributes.id, 0);
	}

	for (const server of servers) {
		if (!nodeServerCount.has(server.attributes.node)) continue;
		const count = nodeServerCount.get(server.attributes.node) ?? 0;
		nodeServerCount.set(server.attributes.node, count + 1);
	}

	const sortedNodes = [...nodeServerCount.entries()].sort((a, b) => a[1] - b[1]);

	const leastServers = sortedNodes[0][1];

	const availableNodes = sortedNodes.filter((n) => n[1] === leastServers);

	const nodeId = availableNodes[Math.floor(Math.random() * availableNodes.length)][0];

	// Create server
	const game = await getGame(match.gameId);
	if (!game) {
		throw new Error(`Game with id ${match.gameId} not found`);
	}

	// Get free allocation
	const allocations = await pteroAdmin
		.getAllAllocations(nodeId)
		.then((r) => r.sort((a, b) => a.attributes.port - b.attributes.port));

	const portCount = game.deployment.data.port_count ?? 1;

	// Find consecutive free allocations
	let freeAllocations = [];
	for (let i = 0; i < allocations.length; i++) {
		const allocation = allocations[i].attributes;
		if (!allocation.assigned) {
			freeAllocations.push(allocation);
		} else {
			freeAllocations = [];
		}
		if (freeAllocations.length === portCount) {
			break;
		}
	}
	if (freeAllocations.length < portCount) {
		throw new Error('Not enough free allocations available');
	}

	const allocation = freeAllocations.shift()!;
	const moreAllocationsIds = freeAllocations.map((a) => a.id);

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
		allocation.id, // defaultAllocationId
		undefined, // addAllocationIds
		environment, // environment
		game.deployment.data.limits.cpu, // cpu
		game.deployment.data.limits.memory, // ram
		game.deployment.data.limits.disk, // disk
		0, // databaseLimit
		portCount, // allocationLimit
		0, // backupLimit
		game.deployment.data.startup, // startupCmd
		game.deployment.data.docker_image, // dockerImage
		game.deployment.data.limits.swap, // swap
		game.deployment.data.limits.io, // io
		true, // startOnCompletion
	);

	await pteroAdmin.editServerBuild(server.id, {
		addAllocations: moreAllocationsIds,
	});

	let connectionString: string | undefined;
	if (game.connection_string) {
		connectionString = game.connection_string
			.replaceAll('${HOST}', allocation.ip)
			.replaceAll('${PORT}', allocation.port.toString())
			.replaceAll('${PASSWORD}', password ?? '');
	}

	const dbServer = await prisma.server.create({
		data: {
			pterodactylId: server.id,
			pterodactylUuid: server.uuid,
			host: allocation.ip,
			port: allocation.port,
			password,
			connectionString,
			match: { connect: { id: match.id } },
		},
	});

	await connectToWebSocket(dbServer.id);

	return server.uuid;
}

export async function deleteServer(serverId: string) {
	logger.info(`Deleting server ${serverId}`);

	const server = await prisma.server.findUnique({ where: { id: serverId } });
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	await pteroAdmin.deleteServer(server.pterodactylId);

	try {
		await prisma.server.delete({ where: { id: serverId } });
	} catch (e) {
		logger.error(`Failed to delete server with id ${serverId}`);
	}
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
