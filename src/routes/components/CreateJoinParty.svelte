<script lang="ts">
  export let message = '';
  export let success = false;
</script>

<div class="h-full flex flex-col items-center justify-center">
  <div class="flex items-center justify-center w-full space-x-4">
    <div class="border-2 border-primary h-32 w-64 flex items-center justify-center">
      <a href="/party/create" class="hover:underline" type="submit">Create Party</a>
    </div>
    <div class="border-2 border-primary h-32 w-64 flex items-center justify-center">
      <div class="flex flex-col items-center space-y-2">
        <label for="code">Join Party</label>
        <input type="text" name="code" id="code" class="bg-transparent border-2 text-center select-none focus:outline-none border-primary" />
        <button class="hover:underline" type="submit" formaction="?/joinParty">Join</button>
      </div>
    </div>
  </div>

  <span class="mt-4 h-4 text-[#f00]" class:text-primary={success}>{message ?? ''}</span>
</div>