<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { GameDeploymentType } from '@prisma/client';

	export let data: PageData;
</script>

<h1>Games</h1>

<form action="?/addGame" method="post" use:enhance>
	<label for="name">
		Name<br />
		<input type="text" name="name" />
	</label>
	<br />
	<br />
	Deployment Type<br />
	<select name="deploymentType" id="deploymentType">
		<option value={GameDeploymentType.COMMAND}>Command</option>
		<option value={GameDeploymentType.SERVER}>Server</option>
	</select>
	<br />
	<br />
	<label for="deploymenyData">
		Deployment Data<br />
		<textarea name="deploymentData" id="deploymentData" cols="30" rows="10" />
	</label>
	<br />
	<button type="submit">Add</button>
</form>

<br />

<form method="post" use:enhance>
	<table>
		<thead>
			<th>ID</th>
			<th>Deployment Type</th>
			<th>Deployment Command</th>
		</thead>
		<tbody>
			{#each data.games as game}
				<tr>
					<td>{game.name}</td>
					<td>{game.deploymentType}</td>
					<td>{game.deploymentData}</td>
					<td>
						<button type="submit" name="gameId" value={game.id} formaction="?/deleteGame">
							Delete
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</form>
