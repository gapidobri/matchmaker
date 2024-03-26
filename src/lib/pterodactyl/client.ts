import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import { Application, Client } from 'jspteroapi';

export const pteroAdmin = new Application(
	env.PTERODACTYL_URL ?? '',
	env.PTERODACTYL_APP_API_KEY ?? '',
	(error) => logger.error(error),
	true,
);

export const pteroUser = new Client(
	env.PTERODACTYL_URL ?? '',
	env.PTERODACTYL_USER_API_KEY ?? '',
	(error) => logger.error(error),
	true,
);
