<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { User } from '@auth/core/types';
	import { signOut } from '@auth/sveltekit/client';

	export let user: User;
</script>

<div class="w-full flex items-center p-1 pr-4">
	<a href="/" class="text-3xl text-primary">FriLAN</a>
	<div class="grow" />
	<a href="{env.PUBLIC_AUTH_URL}/if/user/#/settings">{user.name}</a>
	{#if user.groups.includes('admin')}
		<span class="ml-2">(<a href="/admin">admin</a>)</span>
	{/if}
	<span class="mx-2 text-white">/</span>
	<button on:click={() => signOut()}>Sign out</button>
</div>
