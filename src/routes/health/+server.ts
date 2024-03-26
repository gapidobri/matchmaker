import { prisma } from '$lib/prisma';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch (e) {
		error(500);
	}

	return new Response();
};
