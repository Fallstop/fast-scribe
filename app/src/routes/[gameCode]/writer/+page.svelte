<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";
  import { Input } from "$lib/components/ui/input";
  import TypingViewer from "$lib/components/TypingViewer.svelte";
  import { gameState } from "$lib/state.svelte";
  import { joinGame, nextRound } from "$lib/api.svelte";
  import { json } from "@sveltejs/kit";
  const porps: PageProps = $props();
  const gameCode = $derived(porps.params.gameCode);

  // Keep track of the words. Space moves to the next word.

  let currentInput: string[] = $derived<string[]>(
    gameState.currentInput[gameState.roundNumber]
  );

  $effect(() =>{
    if (!currentInput) {
      gameState.currentInput.push([]);
    }
  })

  function handleInput(event: KeyboardEvent) {
    const key = event.key;
    console.log("Key pressed:", key);


    if (key === " ") {
      // Move to the next word, if the current word is not empty
      if (currentInput.length > 0 && currentInput[currentInput.length - 1].length > 0) {
        currentInput.push("");
      }
    } else if (key.length === 1) {
      // Add character to the current word
      if (currentInput.length === 0) {
        currentInput.push("");
      }
      currentInput[currentInput.length - 1] += key;
    } else if (key === "Backspace") {
      // Remove last character from the current word
      if (currentInput.length > 0 && currentInput[currentInput.length - 1].length > 0) {
        currentInput[currentInput.length - 1] = currentInput[currentInput.length - 1].slice(0, -1);
      } else if (gameState.currentInput.length > 0) {
        currentInput.pop();
      }
    } else if (key === "Enter") {
      nextRound();
    }
    event.preventDefault();

  }

  onMount(async () => {
    // Initialize game state for the specific game code
    await joinGame(gameCode);
  });
</script>

<svelte:body onkeydown={handleInput} />

<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe - Game Code: {gameCode}</h1>
  <p class="mb-8">debug data: {JSON.stringify(gameState.currentInput)} </p>
  {JSON.stringify(currentInput)}

  {#each gameState.gameSentences.slice(Math.max(gameState.roundNumber-1,0), gameState.roundNumber+2) as sentence, index}
    <TypingViewer
      targetText={sentence}
      currentText={gameState.currentInput[index] || []}
      
    />
  {/each}

  <!-- <TypingViewer
    targetText={gameState.gameSentences[gameState.roundNumber] || []}
    currentText={gameState.currentInput[gameState.roundNumber] || []}
  /> -->
</div>
