import type { Actions, PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { GameDeploymentType } from '@prisma/client';

export const load: PageServerLoad = async () => {
	const games = await prisma.game.findMany();

	return { games };
};

export const actions: Actions = {
	async addGame({ request }) {
		const data = await request.formData();

		const name = data.get('name') as string | null;
		if (!name) {
			throw error(400, 'Game name is missing');
		}

		const deploymentType = data.get('deploymentType') as GameDeploymentType | null;
		if (!deploymentType) {
			throw error(400, 'Deployment type is missing');
		}

		const deploymentData = data.get('deploymentData') as string | null;
		if (!deploymentData) {
			throw error(400, 'Deployment data is missing');
		}

		await prisma.game.create({
			data: {
				name,
				deploymentType,
				deploymentData,
			},
		});
	},

	async deleteGame({ request }) {
		const data = await request.formData();

		const gameId = data.get('gameId') as string | null;
		if (!gameId) {
			throw error(400, 'Game ID is missing');
		}

		await prisma.game.delete({
			where: { id: gameId },
		});
	},
};
