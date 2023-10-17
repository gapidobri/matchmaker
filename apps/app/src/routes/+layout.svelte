<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
</script>

{#if $page.data.session?.user}
	<button on:click={() => signOut()}>Sign out</button>
	<span>Signed in as {$page.data.session.user.email}</span>
{:else}
	<button on:click={() => signIn('authentik')}>Sign in</button>
	<span>Not signed in.</span>
{/if}

<br />
<br />

<slot />
