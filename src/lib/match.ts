import { prisma } from '$lib/prisma';
import { emitUserUpdate } from './events';
import { logger } from './logger';

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
