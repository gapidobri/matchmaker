import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

interface GameConfig {
	id: string;
	name: string;
	party_size: number;
	max_players: number;
	deployment: Deployment;
}

interface Deployment {
	type: 'server' | 'command';
	data: DeploymentData;
}

interface DeploymentData {
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
