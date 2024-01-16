import type { GameConfig, GameType } from '$lib/config';
import { logger } from '$lib/logger';
import { deleteMatch } from '$lib/match';
import { prisma } from '$lib/prisma';
import { deleteServer } from './server';

export async function handlePlayerConnected(userId: string, serverId: string, game: GameConfig) {
	logger.info(`Player with id ${userId} connected to server`);

	const user = await getUserByGameId(userId, game.type);
	if (!user) {
		logger.error(`User with id ${userId} not found`);
		return;
	}

	await prisma.partyMember.update({
		where: { userId: user.id },
		data: { connectedServer: { connect: { id: serverId } } },
	});
}

export async function handlePlayerDisconnected(userId: string, serverId: string, game: GameConfig) {
	logger.info(`Player with id ${userId} disconnected from server`);

	const user = await getUserByGameId(userId, game.type);
	if (!user) {
		logger.error(`User with id ${userId} not found`);
		return;
	}

	await prisma.partyMember.update({
		where: { userId: user.id },
		data: { connectedServer: { disconnect: { id: serverId } } },
	});

	await checkServerEmpty(serverId);
}

async function checkServerEmpty(serverId: string) {
	const server = await prisma.server.findUnique({
		where: { id: serverId },
		include: { match: true },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	if (server.match.status !== 'IN_PROGRESS') {
		logger.info('Current match is not in progress, not shutting down server');
		return;
	}

	const connectedPlayerCount = await prisma.partyMember.count({
		where: { connectedServerId: serverId },
	});

	if (connectedPlayerCount !== 0) return;

	logger.info(`Server with id ${serverId} is empty, shutting down...`);

	await deleteServer(serverId);

	await deleteMatch(server.match.id);
}

async function getUserByGameId(userId: string, gameType: GameType) {
	return await prisma.user.findFirst({
		where: {
			steam: { steamId: userId },
		}[gameType],
	});
}
