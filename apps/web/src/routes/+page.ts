import { auth } from '$lib/auth';
import type { PageLoad } from './$types';
import { User } from 'models';

export const load: PageLoad = async () => {
	const user = await auth.getUser();

	const res = await fetch('http://localhost:3000', {
		headers: { Authorization: `Bearer ${user?.access_token}` },
	});

	return {
		data: await res.text(),
	};
};
