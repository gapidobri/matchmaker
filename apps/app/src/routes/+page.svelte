<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<form method="post" use:enhance>
	{#if !data.team}
		<a href="/team/create">Create Team</a>
		<br />
		<br />
		<label for="code">Team Code</label>
		<input type="text" name="code" id="code" />
		<button type="submit" formaction="?/joinTeam">Join</button>
		<p>{form?.message ?? ''}</p>
	{:else}
		<h1>{data.team.name}</h1>
		<h2>Code: {data.team.code}</h2>
		<button type="submit" formaction="?/leaveTeam">Leave</button>

		<h2>Team Members</h2>
		{#each data.team.members as member}
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
			{#each data.team.joinRequests as request}
				<form method="post" use:enhance>
					{request.name}
					<input type="hidden" name="userId" value={request.id} />
					<button type="submit" formaction="?/acceptJoin">Accept</button>
					<button type="submit" formaction="?/declineJoin">Decline</button>
				</form>
				<br />
			{/each}
		{/if}
	{/if}
</form>
