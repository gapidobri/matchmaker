<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';

	if (browser) {
		setInterval(() => {
			invalidateAll();
		}, 1000 * 5);
	}
</script>

<slot />
