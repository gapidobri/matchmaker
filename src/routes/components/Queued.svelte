<script lang="ts">
	import type { Queue } from '@prisma/client';

	export let queue: Queue;
	export let leader: boolean;
</script>

<div>
	<h2>Queued for {queue.gameId}</h2>
	{#if leader}
		<button type="submit" formaction="?/leaveQueue">Leave Queue</button>
	{/if}
</div>
