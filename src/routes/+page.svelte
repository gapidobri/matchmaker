<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import CreateJoinParty from './components/CreateJoinParty.svelte';
	import JoinRequests from './components/JoinRequests.svelte';
	import PartyInfo from './components/PartyInfo.svelte';
	import SelectGame from './components/SelectGame.svelte';
	import Queued from './components/Queued.svelte';
	import MatchInfo from './components/MatchInfo.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data: PageData;
	export let form: ActionData;

	onMount(() => {
		const eventSource = new EventSource('/events');

		eventSource.onmessage = () => {
			invalidateAll();
		};
	});
</script>

<form class="p-4 w-full h-full flex items-center justify-center" method="post" use:enhance>
	{#if !data.party}
		<CreateJoinParty message={form?.message} success={form?.success} />
	{:else}
		<div class="flex flex-col items-stretch space-y-2 w-full max-w-screen-lg">
			<PartyInfo
				party={data.party}
				you={data.session}
				members={data.party.members}
				leader={data.leader}
			/>
			{#if data.leader}
				<JoinRequests joinRequests={data.party.joinRequests} />
			{/if}
			{#if data.party.queue}
				<Queued
					game={data.games.find((g) => g.id === data.party?.queue?.gameId)}
					leader={data.leader}
				/>
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
	{/if}
</form>
