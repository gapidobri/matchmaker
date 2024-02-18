<script lang="ts">
	import { env } from "$env/dynamic/public";
  import type { User } from "@auth/core/types";
	import { signOut } from "@auth/sveltekit/client";

  export let user: User;
</script>

<div class="w-full flex p-1">
  <a href="/">
    <span class="text-[#ff0000] font-bold">Fri</span><span class="text-white">LAN</span>
  </a>
  <div class="grow" />
  <a href="{env.PUBLIC_AUTH_URL}/if/user/#/settings">{user.name}</a>
  {#if user.groups.includes('admin')}
    <span class="ml-2">(<a href="/admin">admin</a>)</span>
  {/if}
  <span class="mx-2">/</span>
  <button on:click={() => signOut()}>Sign out</button>
</div>