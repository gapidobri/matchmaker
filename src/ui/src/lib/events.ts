import { prisma } from '@matchmaker/common';
import { EventEmitter } from 'events';

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

export async function emitPartyUpdate(partyId: string, ...clientIds: string[]) {
	const partyMembers = await prisma.partyMember.findMany({
		where: { partyId },
	});

	const partyClients = LiveUpdateClient.clients.filter((client) =>
		partyMembers.some(
			(member) => member.userId === client.userId || clientIds.includes(client.userId),
		),
	);

	for (const client of partyClients) {
		client.update();
	}
}
