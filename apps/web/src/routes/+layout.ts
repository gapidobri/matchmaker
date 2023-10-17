import { auth } from '$lib/auth';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async () => {
	return {
		user: await auth.getUser(),
	};
};
