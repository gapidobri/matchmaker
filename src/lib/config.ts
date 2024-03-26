import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

export interface GameConfig {
	id: string;
	name: string;
	enabled?: boolean;
	party_size: number;
	max_players: number;
	password?: boolean;
	join_regex?: string;
	leave_regex?: string;
	min_teams: number;
	max_teams: number;
	min_team_size: number;
	max_team_size: number;
	setup_commands?: string[];
	start_game_command?: string;
	connection_string?: string;
	auto_start_game?: number;
	deployment: Deployment;
}

interface Deployment {
	type: 'server' | 'command';
	data: DeploymentData;
}

interface DeploymentData {
	nest: number;
	egg: number;
	docker_image: string;
	startup: string;
	port_count?: number;
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
	const configPath = env.GAMES_FOLDER ?? './config/games';
	const configDir = await fs.readdir(configPath);

	const configs: GameConfig[] = [];
	for (const fileName of configDir) {
		const configString = await fs.readFile(path.join(configPath, fileName));
		const config: GameConfig = YAML.parse(configString.toString());
		if (config.enabled === true) {
			configs.push(config);
		}
	}

	return configs;
}
