<script>
  import Button from "$lib/components/ui/button/button.svelte";
  import { io } from "socket.io-client";
  import { onMount } from "svelte";

  function create() {}

  onMount(() => {
    const socket = io("localhost:5173");
    socket.on("message", (message) => {
      console.log(message);
    });
  });
</script>

<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe</h1>
  <p class="mb-8">Can you out-write the timer?</p>
  <Button onclick={create} size="lg">Create Game</Button>
</div>
