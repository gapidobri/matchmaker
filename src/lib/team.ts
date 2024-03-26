import { emitUserUpdate } from './events';
import { logger } from './logger';
import { deleteMatch } from './match';
import { prisma } from './prisma';
import { deleteServer } from './pterodactyl/server';

export async function cleanupTeams() {
	logger.info('Cleaning up teams');

	const teams = await prisma.team.findMany({ include: { players: true } });
	for (const team of teams) {
		if (team.players.length === 0) {
			await deleteTeam(team.id);
		}
	}
}

export async function deleteTeam(teamId: string) {
	logger.info(`Deleting team ${teamId}`);

	const team = await prisma.team.delete({
		where: { id: teamId },
		include: { players: true },
	});

	const match = await prisma.match.findUnique({
		where: { id: team.matchId },
		select: { teams: true, server: true },
	});
	if (!match) {
		logger.error(`Match with id ${team.matchId} not found`);
		return;
	}
	if (match.teams.length === 0) {
		if (match.server) {
			await deleteServer(match.server.id);
		}
		await deleteMatch(team.matchId);
	}

	await emitUserUpdate(...team.players.map((player) => player.userId));
}
