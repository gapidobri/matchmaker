<script lang="ts">
	import '../app.pcss';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const eventSource = new EventSource('/events');

		eventSource.onmessage = () => {
			invalidateAll();
		};
	});
</script>

{#if $page.data.session?.user}
	<button on:click={() => signOut()}>Sign out</button>
	<span>Signed in as {$page.data.session.user.email}</span>
	{#if $page.data.session.user.steamId}
		[steamId: {$page.data.session.user.steamId}]
	{/if}
	{#if $page.data.session.user.groups.includes('admin')}
		(<a href="/admin">admin</a>)
	{/if}
{:else}
	<button on:click={() => signIn('authentik')}>Sign in</button>
	<span>Not signed in.</span>
{/if}

<br />
<br />

<slot />
