<script lang="ts">
	import type { Party } from "@prisma/client";

  export let party: Party;
</script>

<div class="border-2 border-primary p-2 flex flex-col justify-start">
  <span class="text-2xl font-bold">{party.name}</span>
  <span class="text-md">Join code: {party.code}</span>
  <button class="w-min text-[#f00] hover:underline" type="submit" formaction="?/leaveParty">Leave</button>
</div>