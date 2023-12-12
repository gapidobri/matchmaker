import { SvelteKitAuth } from '@auth/sveltekit';
import Authentik from '@auth/core/providers/authentik';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '$lib/prisma';
import { env } from '$env/dynamic/private';

export const handle = SvelteKitAuth({
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	providers: [
		Authentik({
			clientId: env.OIDC_CLIENT_ID,
			clientSecret: env.OIDC_CLIENT_SECRET,
			issuer: env.OIDC_ISSUER,
		}),
	],
	callbacks: {
		jwt({ token, profile }) {
			if (profile) {
				token.groups = profile.groups;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user && token.sub) {
				session.user.id = token.sub;
				session.user.groups = token.groups;
			}
			return session;
		},
	},
});
