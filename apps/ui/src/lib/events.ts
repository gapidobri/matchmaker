import { EventEmitter } from 'events';

export const eventsStream = new EventEmitter();

export function emitPartyUpdate(partyId: string) {
	console.log(partyId);

	eventsStream.emit('message');
}
