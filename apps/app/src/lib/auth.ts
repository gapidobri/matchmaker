import { error } from '@sveltejs/kit';

export async function getUserId(locals: App.Locals): Promise<string> {
	const session = await locals.getSession();
	const userId = session?.user.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}
	return userId;
}
