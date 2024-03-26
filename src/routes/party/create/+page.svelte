<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="h-full flex flex-col items-center justify-center">
	<form
		class="border-2 border-primary h-32 w-64 flex flex-col items-center justify-center space-y-2"
		action="?/createParty"
		method="post"
		use:enhance
	>
		<span>Create party</span>
		<input
			type="text"
			name="name"
			id="name"
			placeholder="Name"
			class="bg-transparent border-2 text-center select-none focus:outline-none border-primary placeholder:text-placeholder"
		/>
		<div class="w-full flex justify-center space-x-4">
			<a class="hover:underline" href="/">Back</a>
			<button class="hover:underline" type="submit">Create</button>
		</div>
	</form>

	<span class="mt-4 h-4 text-error-red">{form?.message ?? ''}</span>
</div>
