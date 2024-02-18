<script lang="ts">
	import type { Match, Server } from '@prisma/client';

	export let match: Pick<Match, 'id' | 'status'> & {
		server: Pick<
			Server,
			'connectedPlayerIds' | 'connectionString' | 'host' | 'port' | 'password'
		> | null;
	};
	export let expectedPlayerCount: number;
	export let leader: boolean;
</script>

<h2>In match {match.id}</h2>
<p>Status: {match.status}</p>
{#if match.server}
	<p>
		Players connected: {match.server.connectedPlayerIds.length}/{expectedPlayerCount}
	</p>
	{#if match.status !== 'CREATING'}
		{#if match.server.connectionString}
			<a href={match.server.connectionString}>{match.server?.connectionString}</a>
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
	<button type="submit" formaction="?/leaveMatch">Leave Match</button>
{/if}
