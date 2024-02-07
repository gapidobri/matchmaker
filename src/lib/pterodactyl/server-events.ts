import { getConfig } from '$lib/config';
import { logger } from '$lib/logger';
import { prisma } from '$lib/prisma';
import { pteroUser } from './client';

export async function handleServerRunning(serverId: string) {
	const server = await prisma.server.findUnique({
		where: { id: serverId },
		include: { match: true },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	if (server.match.status !== 'WAIT_FOR_JOIN') return;

	const config = await getConfig();
	const gameConfig = config.find((game) => game.id === server.match.gameId);
	if (!gameConfig) {
		logger.error(`Game with id ${server.match.gameId} not found`);
		return;
	}

	if (gameConfig.setup_commands) {
		for (const command of gameConfig.setup_commands) {
			await pteroUser.sendCommand(server.pterodactylUuid, command);
		}
	}
}
