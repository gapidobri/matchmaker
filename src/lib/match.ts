import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import { emitMatchUpdate, emitUserUpdate } from './events';
import { logger } from './logger';
import { sendStartGameCommand } from './pterodactyl/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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

	try {
		const match = await prisma.match.delete({
			where: { id: matchId },
			include: { teams: { include: { players: true } } },
		});

		await emitUserUpdate(
			...match.teams.flatMap((team) => team.players.map((player) => player.userId)),
		);
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			if (e.code === 'P2003') {
				logger.error('Match has a server, delete the server first');
				error(400, 'Match has a server, delete the server first');
			}
		}
	}
}
