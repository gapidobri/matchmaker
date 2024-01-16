import { env } from '$env/dynamic/private';
import { Application, Client } from 'jspteroapi';

export const pteroAdmin = new Application(
	env.PTERODACTYL_URL ?? '',
	env.PTERODACTYL_APP_API_KEY ?? '',
	undefined,
	true,
);

export const pteroUser = new Client(
	env.PTERODACTYL_URL ?? '',
	env.PTERODACTYL_USER_API_KEY ?? '',
	undefined,
	true,
);
