<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import CreateJoinParty from './components/CreateJoinParty.svelte';
	import JoinRequests from './components/JoinRequests.svelte';
	import PartyInfo from './components/PartyInfo.svelte';
	import PartyMembers from './components/PartyMembers.svelte';
	import SelectGame from './components/SelectGame.svelte';
	import Queued from './components/Queued.svelte';
	import MatchInfo from './components/MatchInfo.svelte';

	export let data: PageData;
	export let form: ActionData;
</script>

<form class="p-4 w-full h-full" method="post" use:enhance>
	{#if !data.party}
		<CreateJoinParty message={form?.message} success={form?.success} />
	{:else}
		<div class="flex">
			<div>
				{#if data.party.queue}
					<Queued queue={data.party.queue} leader={data.leader} />
				{:else if data.match}
					<MatchInfo
						match={data.match}
						leader={data.leader}
						expectedPlayerCount={data.expectedPlayerCount}
					/>
				{:else if data.leader}
					<SelectGame games={data.games} />
				{:else}
					<span>Wait for party leader to select a game</span>
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
