import { PTERODACTYL_API_KEY, PTERODACTYL_URL } from '$env/static/private';
import Pterodactyl from '@avionrx/pterodactyl-js';

export const pteroAdmin = new Pterodactyl.Builder()
	.setURL(PTERODACTYL_URL)
	.setAPIKey(PTERODACTYL_API_KEY)
	.asAdmin();

export const pteroUser = new Pterodactyl.Builder()
	.setURL(PTERODACTYL_URL)
	.setAPIKey(PTERODACTYL_API_KEY)
	.asUser();
