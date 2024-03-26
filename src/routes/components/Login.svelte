<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
</script>

<div class="flex flex-col items-center justify-center h-full">
	<pre class="leading-4">██████       ██
				  ██      ▟▀▀▀▀▙  ███████
██████ █████ ██   ██     █▘    ▝█ ██   ██
██	   ██    ██   ██     █ ╻╻╻╻ █ ██   ██
██     ██    ██   ██████ ████████ ██   ██</pre>

	<div class="mt-8 px-2 py-1">
		<button
			class="text-sm underline decoration-white hover:decoration-primary decoration-dotted underline-offset-4 transition-colors"
			on:click={() => signIn('authentik')}>Sign in</button
		>
	</div>
</div>
