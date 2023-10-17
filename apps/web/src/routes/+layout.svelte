<script lang="ts">
	import { auth } from '$lib/auth';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	function handleLogin() {
		auth.signinRedirect({ scope: 'openid profile email' });
	}

	function handleLogout() {
		auth.signoutRedirect();
	}
</script>

{#if data.user}
	<span>Logged in as {data.user.profile.name}</span>
	<button on:click={handleLogout}>Logout</button>
{:else}
	<button on:click={handleLogin}>Login</button>
{/if}

<br />

<slot />
