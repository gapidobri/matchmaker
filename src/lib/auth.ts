import { error } from '@sveltejs/kit';

export async function getUserId(locals: App.Locals): Promise<string> {
	const session = await locals.auth();
	const userId = session?.user?.id;
	if (!userId) {
		error(401, 'Unauthorized');
	}
	return userId;
}

export async function isAdmin(locals: App.Locals): Promise<boolean> {
	const session = await locals.auth();
	return session?.user?.groups?.includes('admin') ?? false;
}
