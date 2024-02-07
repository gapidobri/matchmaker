import { getGame } from '$lib/game';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { pteroUser } from './client';
import { handlePlayerConnected, handlePlayerDisconnected } from './player-events';
import { handleServerRunning } from './server-events';

export async function reconnectWebSockets() {
	const servers = await prisma.server.findMany();

	logger.info(`Reconnecting ${servers.length} websockets`);

	for (const server of servers) {
		await connectToWebSocket(server.id).catch((e) => {
			logger.error(`Failed to reconnect websocket for server ${server.id}`, e);
		});
	}
}

export async function connectToWebSocket(serverId: string) {
	const server = await prisma.server.findUnique({
		where: { id: serverId },
		include: { match: true },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	const game = await getGame(server.match.gameId);
	if (!game) {
		logger.error(`Game with id ${server.match.gameId} not found`);
		return;
	}

	const socket = await pteroUser.startConsoleConnection(server.pterodactylUuid);

	logger.info('Connected to server console', serverId);

	socket.on('console output', async (data) => {
		// Check player connected
		if (game.join_regex) {
			const result = new RegExp(game.join_regex).exec(data);
			if (result && result.groups?.userId) {
				await handlePlayerConnected(result.groups.userId, server.id, game);
				return;
			}
		}

		// Check player disconnected
		if (game.leave_regex) {
			const result = new RegExp(game.leave_regex).exec(data);
			if (result && result.groups?.userId) {
				await handlePlayerDisconnected(result.groups.userId, serverId, game);
				return;
			}
		}
	});

	socket.on('status', async (status) => {
		logger.debug(`Server ${serverId} status: ${status}`);
		switch (status) {
			case 'running':
				await handleServerRunning(serverId);
				break;
		}
	});
}
