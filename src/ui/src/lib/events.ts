import { mqtt } from './mqtt';

export function updateParty(partyId: string) {
	console.log('Updating party', partyId);

	mqtt.publish('update-party', partyId);
}
