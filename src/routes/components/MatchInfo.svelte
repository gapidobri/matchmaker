<script lang="ts">
	import type { GameConfig } from '$lib/config';
	import type { Match, Server } from '@prisma/client';

	export let game: Pick<GameConfig, 'name'> | undefined;
	export let match: Pick<Match, 'id' | 'status' | 'gameId'> & {
		server: Pick<
			Server,
			'connectedPlayerIds' | 'connectionString' | 'host' | 'port' | 'password'
		> | null;
	};
	export let expectedPlayerCount: number;
	export let leader: boolean;

	const statuses = {
		CREATING: 'The server is being created',
		WAIT_FOR_JOIN: 'The server is waiting for players to join',
		IN_PROGRESS: 'The match is in progress',
	};
</script>

<h2>In match {game?.name ?? ''}</h2>
<p>Status: {statuses[match.status]}</p>
{#if match.server}
	<p>
		Players connected: {match.server.connectedPlayerIds.length}/{expectedPlayerCount}
	</p>
	{#if match.status !== 'CREATING'}
		{#if match.server.connectionString}
			<a class="text-emerald-400" href={match.server.connectionString}>Connect to server</a>
		{:else}
			<p>IP: {match.server.host}</p>
			<p>Port: {match.server.port}</p>
			{#if match.server.password}
				<p>Password: {match.server.password}</p>
			{/if}
		{/if}
	{/if}
{/if}
{#if leader}
	<button class="text-error-red" type="submit" formaction="?/leaveMatch">Leave Match</button>
{/if}
