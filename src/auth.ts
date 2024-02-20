import { SvelteKitAuth } from '@auth/sveltekit';
import Authentik from '@auth/core/providers/authentik';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '$lib/prisma';
import { env } from '$env/dynamic/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: 'jwt',
	},
	debug: true,
	providers: [
		Authentik({
			clientId: env.OIDC_CLIENT_ID,
			clientSecret: env.OIDC_CLIENT_SECRET,
			issuer: env.OIDC_ISSUER,
			// authorization: env.EXTERNAL_AUTH_URL
			// 	? `${env.EXTERNAL_AUTH_URL}/application/o/authorize/`
			// 	: undefined,
			profile: (profile) => ({
				id: profile.sub,
				email: profile.email,
				name: profile.name,
			}),
		}),
	],
	callbacks: {
		async jwt({ token, profile }) {
			if (profile) {
				token.groups = profile.groups;
			}
			if (profile?.steam_id) {
				await prisma.user.update({
					where: { id: token.sub },
					data: { steamId: profile.steam_id.toString() },
				});
			}
			return token;
		},
		session({ session, token }) {
			if (session.user && token.sub) {
				session.user.id = token.sub;
				session.user.groups = token.groups as string[];
			}
			return session;
		},
	},
});
