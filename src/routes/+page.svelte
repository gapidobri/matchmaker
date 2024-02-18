<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import CreateJoinParty from './components/CreateJoinParty.svelte';
	import JoinRequests from './components/JoinRequests.svelte';
	import PartyInfo from './components/PartyInfo.svelte';
	import PartyMembers from './components/PartyMembers.svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<form class="p-4 w-full h-full" method="post" use:enhance>
	{#if !data.party}
		<CreateJoinParty message={form?.message} success={form?.success} />
	{:else}
		<div class="flex">
			<div>
				{#if data.match}
					<h2>In match {data.match.id}</h2>
					<p>Status: {data.match.status}</p>
					{#if data.match.server}
						<p>
							Players connected: {data.match.server.connectedPlayerIds
								.length}/{data.expectedPlayerCount}
						</p>
						{#if data.match.status !== 'CREATING'}
						{#if data.match.server.connectionString}
							<a href={data.match.server.connectionString}>{data.match.server?.connectionString}</a>
						{:else}
							<p>IP: {data.match.server.host}</p>
							<p>Port: {data.match.server.port}</p>
							{#if data.match.server.password}
								<p>Password: {data.match.server.password}</p>
							{/if}
						{/if}
					{/if}
					{/if}
					{#if data.leader}
						<br />
						<br />
						<button type="submit" formaction="?/leaveMatch">Leave Match</button>
					{/if}
				{:else if !data.party.queue}
					{#if data.leader}
						<h2>Select Game Queue</h2>
						{#each data.games as game}
							<div>
								<input type="radio" name="gameId" value={game.id} />
								{game.name}
							</div>
						{/each}
						<br />
						<button type="submit" formaction="?/joinQueue">Join Queue</button>
					{/if}
				{:else}
					<h2>Queued for {data.party.queue.gameId}</h2>
					{#if data.leader}
						<button type="submit" formaction="?/leaveQueue">Leave Queue</button>
					{/if}
				{/if}
			</div>
			<div class="grow" />
			<div class="flex flex-col space-y-2">
				<PartyInfo party={data.party} />
				<PartyMembers members={data.party.members} leader={data.leader} />
				{#if data.leader}
					<JoinRequests joinRequests={data.party.joinRequests} />
				{/if}
			</div>
		</div>

	{/if}
</form>

<br />
