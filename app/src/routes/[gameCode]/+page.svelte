<script lang="ts">
  import type { PageProps } from "./$types";
  import TypingViewer from "$lib/components/TypingViewer.svelte";
  import { gameState } from "$lib/state.svelte";
  import { receive, send } from "$lib/transistion";
  import { flip } from 'svelte/animate';
  import { createClient, type WsClient } from '$lib/api.svelte';
  import { onMount } from "svelte";

  const props: PageProps = $props();
  const gameCode = $derived(props.params.gameCode);

  let isPlaying = $state(false);

  let currentInput: string[] = $derived<string[]>(
    gameState.currentInput[gameState.roundNumber]
  );

  $effect(() =>{
    if (!currentInput) {
      gameState.currentInput.push([]);
    }
  })

  let client: WsClient | undefined = $state(); 

  onMount(() => {
      createClient(gameCode).then((conn) => client = conn);
  })

  $effect(() => {
    if (!client) {
        return;
    }

    client.connect("dictator");
    client.on("game_start", (msg) => {
        isPlaying = true;
    }) 
  });
</script>

<svelte:body />


{#if client}
{#if isPlaying}
<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe (Dictator view!)</h1>
  <p class="mb-8">debug data: {JSON.stringify(gameState.currentInput)} </p>
  {JSON.stringify(currentInput)}

  <div class="flex flex-col items-left justify-center gap-2 w-full max-w-[80ch] overflow-x-hidden h-[12ex] rounded bg-accent">
    {#each gameState.gameSentences.entries().toArray().slice(Math.max(gameState.roundNumber-1,0), gameState.roundNumber+2) as all (all[0])}
      {@const true_index = all[0]}
      {@const sentence = all[1]}
      <div
          in:receive={{ key: true_index }}
          out:send={{ key: true_index }}
          animate:flip
      >
        <TypingViewer
          targetText={sentence}
          currentText={gameState.currentInput[true_index] || []}
          active={true_index === gameState.roundNumber}
        />
  
      </div>
    {/each}

  </div>


  <!-- <TypingViewer
    targetText={gameState.gameSentences[gameState.roundNumber] || []}
    currentText={gameState.currentInput[gameState.roundNumber] || []}
  /> -->
</div>

{:else}
Waiting for start
{/if}
{:else}
Loading fool
{/if}
