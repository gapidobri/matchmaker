import { error } from '@sveltejs/kit';
import { getConfig } from './config';

export async function getGame(gameId: string) {
	const games = await getConfig();
	const game = games.find((g) => g.id === gameId);
	if (!game) {
		throw error(404, 'Game not found');
	}
	return game;
}
