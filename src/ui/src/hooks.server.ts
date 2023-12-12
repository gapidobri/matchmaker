import { SvelteKitAuth } from '@auth/sveltekit';
import Authentik from '@auth/core/providers/authentik';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '$lib/prisma';
import { env } from '$env/dynamic/private';

export const handle = SvelteKitAuth({
	adapter: PrismaAdapter(prisma),
	providers: [
		Authentik({
			clientId: env.OIDC_CLIENT_ID,
			clientSecret: env.OIDC_CLIENT_SECRET,
			issuer: env.OIDC_ISSUER,
			profile: (profile) => {
				console.log('profile', profile);
				return {
					id: profile.sub,
					name: profile.name,
					email: profile.email,
					groups: profile.groups,
				};
			},
		}),
	],
	callbacks: {
		session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}
			console.log({ session, user });
			return session;
		},
	},
});
