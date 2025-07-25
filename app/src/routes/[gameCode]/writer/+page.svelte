<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";
  import { Input } from "$lib/components/ui/input";
  import TypingViewer from "$lib/components/TypingViewer.svelte";
  const porps: PageProps = $props();
  const gameCode = $derived(porps.params.gameCode);

  // Keep track of the words. Space moves to the next word.
  let input_state = $state<string[]>([]);

  function handleInput(event: KeyboardEvent) {
    const key = event.key;
    console.log("Key pressed:", key);
    if (key === " ") {
      // Move to the next word, if the current word is not empty
      if (input_state.length > 0 && input_state[input_state.length - 1].length > 0) {
        input_state.push("");
      }
    } else if (key.length === 1) {
      // Add character to the current word
      if (input_state.length === 0) {
        input_state.push("");
      }
      input_state[input_state.length - 1] += key;
    } else if (key === "Backspace") {
      // Remove last character from the current word
      if (input_state.length > 0 && input_state[input_state.length - 1].length > 0) {
        input_state[input_state.length - 1] = input_state[input_state.length - 1].slice(0, -1);
      } else if (input_state.length > 0) {
        input_state.pop();
      }
    }
    event.preventDefault();
  }

  onMount(() => {});
</script>

<svelte:body onkeydown={handleInput} />

<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe - Game Code: {gameCode}</h1>
  <p class="mb-8">debug data: {JSON.stringify(input_state)} </p>

  <TypingViewer
    targetText={"This is a test sentence. Another sentence to type.".split(" ")}
    currentText={input_state}
  />
</div>
