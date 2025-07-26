<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";
  import { Input } from "$lib/components/ui/input";
  import TypingViewer from "$lib/components/TypingViewer.svelte";
  import { gameState } from "$lib/state.svelte";
  const porps: PageProps = $props();
  const gameCode = $derived(porps.params.gameCode);

  // Keep track of the words. Space moves to the next word.

  function handleInput(event: KeyboardEvent) {
    const key = event.key;
    console.log("Key pressed:", key);
    if (key === " ") {
      // Move to the next word, if the current word is not empty
      if (gameState.currentInput.length > 0 && gameState.currentInput[gameState.currentInput.length - 1].length > 0) {
        gameState.currentInput.push("");
      }
    } else if (key.length === 1) {
      // Add character to the current word
      if (gameState.currentInput.length === 0) {
        gameState.currentInput.push("");
      }
      gameState.currentInput[gameState.currentInput.length - 1] += key;
    } else if (key === "Backspace") {
      // Remove last character from the current word
      if (gameState.currentInput.length > 0 && gameState.currentInput[gameState.currentInput.length - 1].length > 0) {
        gameState.currentInput[gameState.currentInput.length - 1] = gameState.currentInput[gameState.currentInput.length - 1].slice(0, -1);
      } else if (gameState.currentInput.length > 0) {
        gameState.currentInput.pop();
      }
    }
    event.preventDefault();
  }

  onMount(() => {});
</script>

<svelte:body onkeydown={handleInput} />

<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe - Game Code: {gameCode}</h1>
  <p class="mb-8">debug data: {JSON.stringify(gameState.currentInput)} </p>

  <TypingViewer
    targetText={gameState.gameSentences[gameState.roundNumber] || []}
    currentText={gameState.currentInput}
  />
</div>
