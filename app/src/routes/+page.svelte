<script>
  
  import { goto } from "$app/navigation";
  import { createGame } from "$lib/api.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  
  import QrCode from "svelte-qrcode"

  let gameId = "";

  function create() {
    gameId = createGame();
    // goto(`/${gameId}/writer`);
  }

  onMount(() => {
    const socket = io("localhost:42069");
    socket.on("message", (message) => {
      console.log(message);
    });
  });
</script>

<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe</h1>
  <p class="mb-8">Can you out-write the timer?</p>
  <AlertDialog.Root>
  <AlertDialog.Trigger>
      <Button onclick={create} size="lg">Create Game</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Join the game</AlertDialog.Title>
      <AlertDialog.Description class="flex flex-col gap-2">
        <p>
          Other players can join your game using the link:
        </p>
        <code class="bg-secondary p-1 rounded">{location?.origin}/{gameId}</code>

        <div class="flex items-center justify-center mt-4">
          <div class="bg-white p-2 rounded">
            <QrCode value="https://github.com/" />
          </div>
        </div>

      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <a href="/{gameId}/writer" class="inline-block">
        <AlertDialog.Action>Start Game</AlertDialog.Action>
      </a>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
</div>
