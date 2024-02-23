<script lang="ts">
	import '../app.pcss';
	import { page } from '$app/stores';
	import Login from './components/Login.svelte';
	import Navbar from './components/Navbar.svelte';
</script>

<div class="flex flex-col bg-offblack font-mono h-screen w-screen text-primary border-primary">
	{#if $page.data.session}
		<Navbar user={$page.data.session.user} />
		<slot />
	{:else}
		<Login />
	{/if}
</div>
