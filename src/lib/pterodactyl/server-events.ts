import { getConfig } from '$lib/config';
import { emitMatchUpdate } from '$lib/events';
import { getGame } from '$lib/game';
import { logger } from '$lib/logger';
import { startMatch } from '$lib/match';
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

	switch (server.match.status) {
		case 'CREATING': {
			await prisma.match.update({
				where: { id: server.matchId },
				data: { status: 'WAIT_FOR_JOIN' },
			});

			await emitMatchUpdate(server.matchId);
			break;
		}

		case 'WAIT_FOR_JOIN': {
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

			const game = await getGame(server.match.gameId);

			if (!game?.auto_start_game) {
				break;
			}

			const startSeconds = game?.auto_start_game;

			logger.info(`Auto starting game in ${startSeconds} s`);

			setTimeout(async () => {
				await startMatch(server.match.id);
			}, startSeconds * 1000);
			break;
		}
	}
}
