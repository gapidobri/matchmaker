import { getUserId } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = await getUserId(locals);

	const teamMember = await prisma.teamMember.findFirst({ where: { userId } });
	if (!teamMember) {
		return { team: null };
	}

	const team = await prisma.team.findFirst({
		where: { members: { some: { userId } } },
		include: {
			members: {
				select: {
					leader: true,
					user: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			joinRequests: teamMember.leader && {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return { team, leader: teamMember.leader };
};

export const actions: Actions = {
	// joinTeam joins a user to a team by code
	async joinTeam({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const code = data.get('code') as string | null;
		if (!code) {
			throw error(400, 'Team code is missing');
		}

		const team = await prisma.team.findUnique({ where: { code } });
		if (!team) {
			return { success: false, message: 'Team not found' };
		}

		await prisma.team.update({
			where: team,
			data: { joinRequests: { connect: { id: userId } } },
		});
	},

	// leaveTeam removes a user from a team
	async leaveTeam({ locals }) {
		const userId = await getUserId(locals);

		const { teamId } = await prisma.teamMember.delete({
			where: { userId },
		});

		const newLeader = await prisma.teamMember.findFirst({
			where: { teamId },
		});
		if (!newLeader) {
			return;
		}

		await prisma.teamMember.update({
			where: newLeader,
			data: { leader: true },
		});
	},

	// acceptJoin accepts a join request from a user
	async acceptJoin({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const joiningUserId = data.get('userId') as string | null;
		if (!joiningUserId) {
			throw error(400, 'User ID is missing');
		}

		// Find team where the user is leader and joining user has requested to join
		const team = await prisma.team.findFirst({
			where: {
				members: { some: { userId, leader: true } },
				joinRequests: { some: { id: joiningUserId } },
			},
		});
		if (!team) {
			throw error(404, 'Team not found');
		}

		await prisma.team.update({
			where: team,
			data: {
				// Add user to members of the team
				members: { create: { userId: joiningUserId } },
				// Remove user from join requests
				joinRequests: { disconnect: { id: joiningUserId } },
			},
		});
	},

	// declineJoin declines a join request from a user
	async declineJoin() {},

	// kickMember kicks a member from the team
	async kickMember({ locals, request }) {
		const userId = await getUserId(locals);

		const data = await request.formData();

		const memberId = data.get('userId') as string | null;
		if (!memberId) {
			throw error(400, 'User ID is missing');
		}

		if (userId === memberId) {
			throw error(400, 'Cannot kick yourself');
		}

		await prisma.teamMember.delete({
			where: {
				userId: memberId,
				team: {
					members: {
						some: {
							userId,
							leader: true,
						},
					},
				},
			},
		});
	},
};
