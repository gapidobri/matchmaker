<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		const eventSource = new EventSource('/events');
		eventSource.onmessage = (event) => {
			console.log('event');
		};
	});
</script>
