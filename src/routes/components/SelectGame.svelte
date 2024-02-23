<script lang="ts">
	import { enhance } from '$app/forms';
	import type { GameConfig } from '$lib/config';

	export let games: GameConfig[];
</script>

<div class="flex flex-col border-2 border-primary p-2">
	<span class="text-2xl mb-2">Select Game Queue</span>

	<form method="post" class="grid lg:grid-cols-2 grid-cols-1 justify-start max-h-[30vh] overflow-y-auto scroll" use:enhance>
		{#each games as game}
			<button
				class="w-max hover:underline"
				type="submit"
				formaction="?/joinQueue"
				name="gameId"
				value={game.id}
			>
				{game.name}
			</button>
		{/each}
	</form>
</div>
