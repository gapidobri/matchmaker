<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<form method="post" use:enhance>
	<input type="text" name="name" value={data.party.name} />
	<button type="submit" formaction="?/updateParty">Save</button>
</form>
