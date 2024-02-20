<script lang="ts">
	import { enhance } from '$app/forms';
	import type { GameConfig } from '$lib/config';

	export let games: GameConfig[];
</script>

<div class="flex flex-col">
	<span class="text-2xl">Select Game Queue</span>

	<form method="post" class="flex flex-col justify-start" use:enhance>
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
