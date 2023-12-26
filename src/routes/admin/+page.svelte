<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Games</h1>

<table>
	<thead>
		<th>ID</th>
		<th>Name</th>
		<th>Max Players</th>
		<th>Party Size</th>
	</thead>
	<tbody>
		{#each data.configs as config}
			<tr>
				<td>{config.id}</td>
				<td>{config.name}</td>
				<td>{config.max_players}</td>
				<td>{config.party_size}</td>
			</tr>
		{/each}
	</tbody>
</table>
