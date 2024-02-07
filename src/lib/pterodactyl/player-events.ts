import type { GameConfig, GameType } from '$lib/config';
import { emitMatchUpdate } from '$lib/events';
import { logger } from '$lib/logger';
import { deleteMatch } from '$lib/match';
import { prisma } from '$lib/prisma';
import { pteroAdmin, pteroUser } from './client';
import { deleteServer, sendStartGameCommand } from './server';

export async function handlePlayerConnected(userId: string, serverId: string, game: GameConfig) {
	logger.info(`Player with id ${userId} connected to server`);

	// Temporary fix until we can get steam id from user
	await prisma.server.update({
		where: { id: serverId },
		data: {
			connectedPlayerIds: { push: userId },
		},
	});

	// const user = await getUserByGameId(userId, game.type);
	// if (!user) {
	// 	logger.error(`User with id ${userId} not found`);
	// 	return;
	// }

	// await prisma.partyMember.update({
	// 	where: { userId: user.id },
	// 	data: { connectedServer: { connect: { id: serverId } } },
	// });

	await checkServerFull(serverId);
}

export async function handlePlayerDisconnected(userId: string, serverId: string, game: GameConfig) {
	logger.info(`Player with id ${userId} disconnected from server`);

	// Temporary fix until we can get steam id from user
	const server = await prisma.server.findUnique({
		where: { id: serverId },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	await prisma.server.update({
		where: { id: serverId },
		data: {
			connectedPlayerIds: server.connectedPlayerIds.filter((id) => id !== userId),
		},
	});

	// const user = await getUserByGameId(userId, game.type);
	// if (!user) {
	// 	logger.error(`User with id ${userId} not found`);
	// 	return;
	// }

	// await prisma.partyMember.update({
	// 	where: { userId: user.id },
	// 	data: { connectedServer: { disconnect: { id: serverId } } },
	// });

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

async function checkServerFull(serverId: string) {
	const server = await prisma.server.findUnique({
		where: { id: serverId },
	});
	if (!server) {
		logger.error(`Server with id ${serverId} not found`);
		return;
	}

	const expectedPlayerCount = await prisma.partyMember.count({
		where: {
			team: {
				match: { server: { id: serverId } },
			},
		},
	});

	if (server.connectedPlayerIds.length !== expectedPlayerCount) return;

	logger.info(`Server with id ${serverId} is full, starting match...`);

	await prisma.match.update({
		where: { id: server.matchId },
		data: { status: 'IN_PROGRESS' },
	});

	await sendStartGameCommand(serverId);

	await emitMatchUpdate(server.matchId);
}

async function getUserByGameId(userId: string, gameType: GameType) {
	return await prisma.user.findFirst({
		where: {
			steam: { steamId: userId },
		}[gameType],
	});
}
