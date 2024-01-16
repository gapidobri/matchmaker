import { prisma } from '$lib/prisma';
import { EventEmitter } from 'events';
import { logger } from './logger';

export class LiveUpdateClient extends EventEmitter {
	static clients: LiveUpdateClient[] = [];

	constructor(public userId: string) {
		super();
		LiveUpdateClient.clients.push(this);
	}

	remove() {
		const index = LiveUpdateClient.clients.indexOf(this);
		if (~index) LiveUpdateClient.clients.splice(index, 1);
	}

	update() {
		this.emit('update');
	}
}

export async function emitUserUpdate(...userIds: string[]) {
	logger.debug(`Emitting user update to ${userIds.length} users`);

	const partyClients = LiveUpdateClient.clients.filter((client) => userIds.includes(client.userId));

	for (const client of partyClients) {
		logger.debug(`Emitting party update to ${client.userId}`);
		client.update();
	}
}

export async function emitPartyUpdate(partyId: string, ...clientIds: string[]) {
	logger.debug(`Emitting party ${partyId} update`);
	const partyMembers = await prisma.partyMember.findMany({
		where: { partyId },
	});

	const partyClients = LiveUpdateClient.clients.filter((client) =>
		partyMembers.some(
			(member) => member.userId === client.userId || clientIds.includes(client.userId),
		),
	);

	for (const client of partyClients) {
		logger.debug(`Emitting party update to ${client.userId}`);
		client.update();
	}
}

export async function emitMatchUpdate(matchId: string) {
	logger.debug(`Emitting match ${matchId} update`);
	const match = await prisma.match.findUnique({
		where: { id: matchId },
		select: { teams: { select: { players: true } } },
	});
	if (!match) return;

	const clientIds = new Set<string>();

	for (const team of match.teams) {
		for (const player of team.players) {
			clientIds.add(player.userId);
		}
	}

	const matchClients = LiveUpdateClient.clients.filter((client) => clientIds.has(client.userId));

	for (const client of matchClients) {
		logger.debug(`Emitting match update to ${client.userId}`);
		client.update();
	}
}
