<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
</script>

<a href="/">Home</a>

<h1>Create Team</h1>

<form action="?/createTeam" method="post" use:enhance>
	<label for="name">Name</label>
	<input type="text" name="name" id="name" />
	<br />
	<br />
	<button type="submit">Create</button>
</form>
