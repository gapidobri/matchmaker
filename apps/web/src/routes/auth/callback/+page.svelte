<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/auth';
	import { onMount } from 'svelte';

	onMount(async () => {
		await auth.signinRedirectCallback();
		goto('/');
	});
</script>
