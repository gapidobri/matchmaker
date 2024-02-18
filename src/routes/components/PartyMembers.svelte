<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PartyMember, User } from '@prisma/client';

	type PublicPartyMember = Pick<PartyMember, 'leader'> & { user: Pick<User, 'id' | 'name'> };

	export let leader: boolean = false;
	export let members: PublicPartyMember[] = [];
</script>

<div class="flex flex-col border-2 border-primary p-2 justify-start">
	<span class="text-xl">Members</span>

	{#each members as member}
		<form class="flex" method="post" use:enhance>
			<span>{member.user.name}</span>
			<div class="grow" />
			{#if leader && !member.leader}
				<button class="text-[#f00] hover:underline" type="submit" formaction="?/kickMember">
					Kick
				</button>
			{/if}
			<input type="hidden" name="userId" value={member.user.id} />
		</form>
	{/each}
</div>
