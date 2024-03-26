<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';

	let interval: number;

	if (browser) {
		interval = setInterval(() => {
			invalidateAll();
		}, 1000 * 5);
	}

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<slot />
