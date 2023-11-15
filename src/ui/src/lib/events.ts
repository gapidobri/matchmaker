import type { JoinPlayer, KickPlayer } from '@matchmaker/common';
import { mqtt } from './mqtt';

export function updateParty(partyId: string) {
	console.log('Updating party', partyId);
	mqtt.publish('update-party', partyId);
}

export function joinPlayerToParty(userId: string, partyId: string) {
	console.log('Joining player', userId, 'to party', partyId);
	const body: JoinPlayer = { userId, partyId };
	mqtt.publish('join-player', JSON.stringify(body));
}

export function kickPlayerFromParty(userId: string, partyId: string) {
	console.log('Kicking player', userId, 'from party', partyId);
	const body: KickPlayer = { userId, partyId };
	mqtt.publish('kick-player', JSON.stringify(body));
}
