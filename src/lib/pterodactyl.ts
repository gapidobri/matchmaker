import { PTERODACTYL_API_KEY, PTERODACTYL_URL } from '$env/static/private';
import Pterodactyl from '@avionrx/pterodactyl-js';

export const pterodactyl = new Pterodactyl.Builder()
	.setURL(PTERODACTYL_URL)
	.setAPIKey(PTERODACTYL_API_KEY)
	.asAdmin();
