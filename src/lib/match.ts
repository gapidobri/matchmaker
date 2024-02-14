import { prisma } from '$lib/prisma';
import { emitMatchUpdate, emitUserUpdate } from './events';
import { logger } from './logger';
import { sendStartGameCommand } from './pterodactyl/server';

export async function startMatch(matchId: string) {
	logger.info(`Starting match ${matchId}`);

	const match = await prisma.match.findUnique({
		where: { id: matchId },
		include: { server: true },
	});
	if (!match) {
		logger.error(`Match with id ${matchId} not found`);
		return;
	}

	if (match.status !== 'WAIT_FOR_JOIN') {
		logger.error(`Match with id ${matchId} is not in WAIT_FOR_JOIN status`);
		return;
	}

	if (!match.server) {
		logger.error(`Match with id ${matchId} does not have a server`);
		return;
	}

	await prisma.match.update({
		where: { id: matchId },
		data: { status: 'IN_PROGRESS' },
	});

	await sendStartGameCommand(match.server.id);

	await emitMatchUpdate(matchId);
}

export async function deleteMatch(matchId: string) {
	logger.info(`Deleting match ${matchId}`);

	const match = await prisma.match.delete({
		where: { id: matchId },
		include: { teams: { include: { players: true } } },
	});

	await emitUserUpdate(
		...match.teams.flatMap((team) => team.players.map((player) => player.userId)),
	);
}
