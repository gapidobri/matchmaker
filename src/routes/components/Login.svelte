<script lang="ts">
	import { signIn } from "@auth/sveltekit/client";
</script>

<div class="flex flex-col items-center justify-center h-full">
	<pre> _____     _ _        _    _   _ 
|  ___| __(_) |      / \  | \ | |
| |_ | '__| | |     / _ \ |  \| |
|  _|| |  | | |___ / ___ \| |\  |
|_|  |_|  |_|_____/_/   \_\_| \_|</pre>

	<div class="mt-8 border-2 border-dashed border-primary px-2 py-1">
		<button class="text-sm" on:click={() => signIn('authentik')}>Sign in</button>
	</div>
</div>
