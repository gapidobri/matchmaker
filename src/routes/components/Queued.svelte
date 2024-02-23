<script lang="ts">
	import type { GameConfig } from '$lib/config';

	export let game: GameConfig & { playerCount: number };
	export let leader: boolean;
</script>

<div class="flex flex-col items-center pt-4">
	<span>
		Queued for {game.name} ({game.playerCount}/{game.min_team_size * game.min_teams} players)
	</span>
	{#if leader}
		<button class="text-error-red hover:underline" type="submit" formaction="?/leaveQueue">
			Leave Queue
		</button>
	{/if}
</div>
