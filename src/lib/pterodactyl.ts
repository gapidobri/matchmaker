import {
	PTERODACTYL_URL,
	PTERODACTYL_APP_API_KEY,
	PTERODACTYL_USER_API_KEY,
} from '$env/static/private';
import { Builder } from '@avionrx/pterodactyl-js';

export const pteroAdmin = new Builder()
	.setURL(PTERODACTYL_URL)
	.setAPIKey(PTERODACTYL_APP_API_KEY)
	.asAdmin();

export const pteroUser = new Builder()
	.setURL(PTERODACTYL_URL)
	.setAPIKey(PTERODACTYL_USER_API_KEY)
	.asUser();
