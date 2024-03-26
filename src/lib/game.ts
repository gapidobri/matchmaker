import { getConfig, type GameConfig } from './config';

export async function getGame(gameId: string): Promise<GameConfig | null> {
	const games = await getConfig();
	return games.find((g) => g.id === gameId) ?? null;
}
