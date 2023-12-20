import type { RequestHandler } from '@sveltejs/kit';
import { LiveUpdateClient } from '$lib/events';
import { getUserId } from '$lib/auth';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = await getUserId(locals);

	const client = new LiveUpdateClient(userId);

	const stream = new ReadableStream({
		start(controller) {
			client.on('update', () => {
				controller.enqueue('event: message\ndata:\n\n');
			});
		},
		cancel() {
			client.remove();
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
};
