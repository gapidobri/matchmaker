import type { DefaultSession } from '@auth/core/types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform
	}
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			id: string;
			groups: string[];
		} & DefaultSession['user'];
	}
}

export {};
