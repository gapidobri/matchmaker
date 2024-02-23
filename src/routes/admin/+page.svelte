<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="p-4">
	<span class="text-2xl">Parties</span>
	<table>
		<thead>
			<th class="px-2">ID</th>
			<th class="px-2">Name</th>
			<th class="px-2">Invite Code</th>
			<th class="px-2">Queue</th>
		</thead>
		<tbody>
			{#each data.parties as party}
				<tr>
					<td class="px-2">{party.id}</td>
					<td class="px-2">{party.name}</td>
					<td class="px-2">{party.code}</td>
					<td class="px-2">{party.queue?.gameId ?? 'Not in queue'}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<br />

	<span class="text-2xl">Matches</span>
	<table>
		<thead>
			<th class="px-2">ID</th>
			<th class="px-2">Game ID</th>
			<th class="px-2">Status</th>
			<th class="px-2">Server Host</th>
			<th class="px-2">Server Port</th>
			<th class="px-2">Server Password</th>
			<th class="px-2">Team Count</th>
			<th class="px-2">Actions</th>
		</thead>
		<tbody>
			{#each data.matches as match}
				<tr>
					<td class="px-2">{match.id}</td>
					<td class="px-2">{match.gameId}</td>
					<td class="px-2">{match.status}</td>
					<td class="px-2">{match.server?.host}</td>
					<td class="px-2">{match.server?.port}</td>
					<td class="px-2">{match.server?.password}</td>
					<td class="px-2">{match.teams.length}</td>
					<td class="px-2">
						<form method="post" use:enhance>
							<input type="hidden" name="matchId" value={match.id} />
							<button type="submit" formaction="?/startMatch">Start</button>
							<button type="submit" formaction="?/deleteMatch" class="text-error-red">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<br />

	<span class="text-2xl">Servers</span>
	<table>
		<thead>
			<th class="px-2">ID</th>
			<th class="px-2">Pterodactyl ID</th>
			<th class="px-2">Pterodactyl UUID</th>
			<th class="px-2">Host</th>
			<th class="px-2">Port</th>
			<th class="px-2">Password</th>
			<th class="px-2">Game ID</th>
			<th class="px-2">Actions</th>
		</thead>
		<tbody>
			{#each data.servers as server}
				<tr>
					<td class="px-2">{server.id}</td>
					<td class="px-2">{server.pterodactylId}</td>
					<td class="px-2">{server.pterodactylUuid}</td>
					<td class="px-2">{server.host}</td>
					<td class="px-2">{server.port}</td>
					<td class="px-2">{server.password}</td>
					<td class="px-2">{server.match.gameId}</td>
					<td class="px-2">
						<form method="post" use:enhance>
							<input type="hidden" name="serverId" value={server.id} />
							<button type="submit" formaction="?/deleteServer" class="text-error-red">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
