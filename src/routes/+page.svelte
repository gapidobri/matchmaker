<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<form method="post" use:enhance>
	{#if !data.party}
		<a href="/party/create">Create Party</a>
		<br />
		<br />
		<label for="code">Party Code</label>
		<input type="text" name="code" id="code" />
		<button type="submit" formaction="?/joinParty">Join</button>
		<p>{form?.message ?? ''}</p>
	{:else}
		<h1>{data.party.name}</h1>
		<h2>Code: {data.party.code}</h2>
		<button type="submit" formaction="?/leaveParty">Leave</button>

		<h2>Party Members</h2>
		{#each data.party.members as member}
			<form method="post" use:enhance>
				{member.user.name}
				<input type="hidden" name="userId" value={member.user.id} />
				{#if data.leader && !member.leader}
					<button type="submit" formaction="?/kickMember">Kick</button>
				{/if}
			</form>
		{/each}

		{#if data.leader}
			<h2>Join Requests</h2>
			{#each data.party.joinRequests as request}
				<form method="post" use:enhance>
					{request.name}
					<input type="hidden" name="userId" value={request.id} />
					<button type="submit" formaction="?/acceptJoin">Accept</button>
					<button type="submit" formaction="?/declineJoin">Decline</button>
				</form>
				<br />
			{/each}

			<hr />
		{/if}
		{#if data.match}
			<h2>In match {data.match.id}</h2>
			<p>Status: {data.match.status}</p>
			{#if data.match.server}
				<p>
					Players connected: {data.match.server?.connectedPlayerIds
						.length}/{data.expectedPlayerCount}
				</p>
			{/if}
			{#if data.match.status !== 'CREATING'}
				<a href={data.match.server?.connectionString}>{data.match.server?.connectionString}</a>
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
	{/if}
</form>

<br />
