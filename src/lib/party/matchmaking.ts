import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import type { PartyMember } from '@prisma/client';

export async function createTeams(partyId: string) {
	const party = await prisma.party.findUnique({
		where: { id: partyId },
		include: { queue: true, members: true },
	});

	if (!party) {
		throw error(404, 'Party not found');
	}

	if (!party.queue) {
		throw error(400, 'Party is not in queue');
	}

	const gameId = party.queue.gameId;

	// TODO: Get game config
	const maxTeams = 2;
	const maxTeamSize = 4;

	// TODO: Preference to always split party into teams and dont add other parties

	let parties = await prisma.party.findMany({
		where: { queue: { gameId } },
		include: { members: true },
	});

	parties = parties.toSorted((a, b) => b.members.length - a.members.length);

	const teams: PartyMember[][] = [[]];
	let teamIndex = 0;

	// Handle the current party
	if (party.members.length > maxTeamSize) {
		// Party has to be split into multiple teams
		for (const member of party.members) {
			if (teams[teamIndex].length >= maxTeamSize) {
				if (teams.length === maxTeams) {
					// TODO: Can't make more teams
					break;
				}
				teams.push([]);
				teamIndex++;
			}
			teams[teamIndex].push(member);
		}
	} else {
		// Party has the perfect size or is not big enough to fill a team
		teams[0].push(...party.members);
	}

	let remainigFreeSlots = maxTeamSize - party.members.length;

	for (const otherParty of parties) {
		if (otherParty.members.length > remainigFreeSlots) {
			continue;
		}

		teams[0].push(...otherParty.members);
		remainigFreeSlots -= otherParty.members.length;
		parties.splice(parties.indexOf(otherParty), 1);
	}

	// Add other parties to the teams
	if (teams[teamIndex].length >= maxTeamSize) {
		teams.push([]);
		teamIndex++;
	}
}
