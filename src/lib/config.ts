import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

export interface GameConfig {
	id: string;
	name: string;
	type: GameType;
	party_size: number;
	max_players: number;
	password?: boolean;
	join_regex?: string;
	leave_regex?: string;
	deployment: Deployment;
}

export type GameType = 'steam';

interface Deployment {
	type: 'server' | 'command';
	data: DeploymentData;
}

interface DeploymentData {
	nest: number;
	egg: number;
	docker_image: string;
	startup: string;
	limits: {
		memory: number;
		swap: number;
		disk: number;
		io: number;
		cpu: number;
	};
	environment: Record<string, string>;
}

// TODO: Load once on server start
export async function getConfig(): Promise<GameConfig[]> {
	const configPath = './config/games';
	const configDir = await fs.readdir(configPath);

	const configs: GameConfig[] = [];
	for (const fileName of configDir) {
		const configString = await fs.readFile(path.join(configPath, fileName));
		const config: GameConfig = YAML.parse(configString.toString());
		configs.push(config);
	}

	return configs;
}
