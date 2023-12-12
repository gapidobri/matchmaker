import { isAdmin } from '$lib/auth';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!(await isAdmin(locals))) {
		console.log('isAdmin is false');
		throw error(403, 'Forbidden');
	}
};
