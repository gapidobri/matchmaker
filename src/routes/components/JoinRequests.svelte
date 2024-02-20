<script lang="ts">
	import { enhance } from '$app/forms';
	import type { User } from '@prisma/client';

	export let joinRequests: Pick<User, 'id' | 'name'>[] = [];
</script>

<div class="flex flex-col border-2 border-primary p-2 justify-start">
	<span class="text-xl">Join Requests</span>

	{#each joinRequests as request}
		<form class="flex" method="post" use:enhance>
			<span class="font-bold">{request.name}</span>
			<div class="grow" />
			<div class="mr-2">
				<button class="hover:underline" type="submit" formaction="?/acceptJoin">✔</button>
				<button class="text-[#f00] hover:underline" type="submit" formaction="?/declineJoin">
					✘
				</button>
			</div>
			<input type="hidden" name="userId" value={request.id} />
		</form>
	{/each}
</div>
