<script lang="ts">
	import '../app.pcss';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import Login from './components/Login.svelte';
	import Navbar from './components/Navbar.svelte';

	onMount(() => {
		const eventSource = new EventSource('/events');

		eventSource.onmessage = () => {
			invalidateAll();
		};
	});
</script>

<div class="flex flex-col bg-black font-mono h-screen w-screen text-primary border-primary">
	{#if $page.data.session?.user}
		<Navbar user={$page.data.session.user} />
		<slot />
	{:else}
		<Login />
	{/if}
</div>

