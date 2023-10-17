import type { User } from 'oidc-client-ts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface Platform
	}
}

export {};
