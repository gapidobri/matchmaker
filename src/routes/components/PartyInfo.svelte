<script lang="ts">
	import type { Party } from '@prisma/client';
	import { enhance } from '$app/forms';
	import type { PartyMember, User } from '@prisma/client';
	import type { Session } from '@auth/sveltekit';

	type PublicPartyMember = Pick<PartyMember, 'leader'> & { user: Pick<User, 'id' | 'name'> };

	export let leader: boolean = false;
	export let members: PublicPartyMember[] = [];
	export let party: Party;
	export let you: Session | null;
</script>

<div class="border-2 border-primary p-2 flex flex-col justify-start">
	<div class="flex flex-row items-center gap-4">
		<span class="text-2xl font-bold">{party.name}</span>
		<span class="text-md text-white">[invite code: {party.code}]</span>

		<span class="flex-grow" />

		<button class="w-min text-error-red hover:underline" type="submit" formaction="?/leaveParty">
			Leave
		</button>
	</div>

	<div class="flex flex-col max-h-[30vh] overflow-y-auto scroll">
		{#each members as member}
			<form class="flex gap-1 hover:bg-offblack-d" method="post" use:enhance>
				<span>{member.user.name}</span>
				{#if member.leader}
					<span class="text-primary">[<span class="text-white">leader</span>]</span>
				{/if}
				{#if you?.user.id === member.user.id}
					<span class="text-primary">[<span class="text-emerald-400">you</span>]</span>
				{/if}
				<div class="grow" />
				{#if leader && !member.leader}
					<button class="text-error-red hover:underline" type="submit" formaction="?/kickMember">
						Kick
					</button>
				{/if}
				<input type="hidden" name="userId" value={member.user.id} />
			</form>
		{/each}
	</div>
</div>
