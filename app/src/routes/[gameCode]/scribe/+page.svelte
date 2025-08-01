<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";
  import TypingViewer from "$lib/components/TypingViewer.svelte";
  import { gameState, updateGameState } from "$lib/state.svelte";
  import { redirect } from "@sveltejs/kit";
  import { receive, send } from "$lib/transistion";
  import { flip } from "svelte/animate";
  import { createClient, type WsClient } from "$lib/api.svelte";
  import { goto } from "$app/navigation";
  import TimeRemainingText from "$lib/components/TimeRemainingText.svelte";
    import { qr } from "@svelte-put/qr/svg";

  const props: PageProps = $props();
  const gameCode = $derived(props.params.gameCode);
  let endsAt = $state(0);

  let gameLink = "";

  let isPlaying = $state(false);

  // Keep track of the words. Space moves to the next word.

  let currentInput: string[] = $derived<string[]>(
    gameState.currentInput[gameState.sentenceNumber],
  );

  $effect(() => {
    if (!currentInput) {
      gameState.currentInput.push([]);
    }
  });

  let client: WsClient | undefined = $state();

  let startTime: DOMHighResTimeStamp;
  function startTimer() {
    startTime = performance.now();
  }
  function endTimer(): DOMHighResTimeStamp {
    return performance.now() - startTime;
  }

  function handleInput(event: KeyboardEvent) {
    const key = event.key;
    // console.log("Key pressed:", key);

    let moveToNextSentence = false;

    if (
      currentInput.length == 0 ||
      (currentInput.length == 1 &&
        currentInput[currentInput.length - 1].length == 0)
    ) {
      startTimer();
    }

    if (key === " ") {
      // Move to the next word, if the current word is not empty
      if (
        currentInput.length > 0 &&
        currentInput[currentInput.length - 1].length > 0 &&
        currentInput.length < gameState.gameSentences[gameState.sentenceNumber].length
      ) {
        currentInput.push("");
      }
    } else if (key.length === 1) {
      // Add character to the current word
      if (currentInput.length === 0) {
        currentInput.push("");
      }
      currentInput[currentInput.length - 1] += key;

      // Check for last word correct completion
      if (
        currentInput.length == gameState.gameSentences[gameState.sentenceNumber].length &&
        currentInput[currentInput.length - 1].length == gameState.gameSentences[gameState.sentenceNumber][currentInput.length - 1].length &&
        currentInput[currentInput.length - 1] === gameState.gameSentences[gameState.sentenceNumber][currentInput.length - 1]

      ) {
        moveToNextSentence = true;
      }
  
    } else if (key === "Backspace") {
      // Remove last full word if control is pressed
      if (event.ctrlKey) {
        if (currentInput[currentInput.length - 1].length >= 1) {
          currentInput.pop();
          currentInput.push("");
        } else {
          currentInput.pop();
          currentInput.pop();
          currentInput.push("");
        }
      } else {
        // Remove last character from the current word
        if (
          currentInput.length > 0 &&
          currentInput[currentInput.length - 1].length > 0
        ) {
          currentInput[currentInput.length - 1] = currentInput[
            currentInput.length - 1
          ].slice(0, -1);
        } else if (gameState.currentInput.length > 0) {
          currentInput.pop();
        }
      }
    }

    client?.sendTypingUpdate(currentInput, gameState.sentenceNumber);

    if (key === "Enter" || moveToNextSentence) {
      let time = endTimer();

      let lettersInCorrectlyTypedWords = 0; // MonkeyType-style WPM
      let allCorrectlyTypedLetters = 0; // MonkeyType-style accuracy
      let allLettersToType =
        gameState.gameSentences[gameState.sentenceNumber].join("").length; // Also for accuracy
      let excessLetters = 0; // More for accuracy
      let allTypedLetters = 0; // MonkeyType-style raw WPM

      currentInput.forEach((word, index) => {
        allTypedLetters += word.length;
        if (index >= gameState.gameSentences[gameState.sentenceNumber].length) {
          excessLetters += word.length;
          return;
        }
        if (word == gameState.gameSentences[gameState.sentenceNumber][index]) {
          lettersInCorrectlyTypedWords += word.length;
          allCorrectlyTypedLetters += word.length;
        } else {
          let correctText = [
            ...gameState.gameSentences[gameState.sentenceNumber][index],
          ];
          [...word].forEach((letter, index) => {
            if (index >= correctText.length) {
              excessLetters++;
              return;
            }
            if (letter == correctText[index]) {
              allCorrectlyTypedLetters++;
            }
          });
        }
      });

      let rawWpm = (allTypedLetters / 5) * (60000 / time);
      let wpm = (lettersInCorrectlyTypedWords / 5) * (60000 / time);
      let finalAccuracy =
        allCorrectlyTypedLetters / (allLettersToType + excessLetters);

      // console.log("RAW:", rawWpm, "WPM:", wpm, "ACC:", accuracy, "EXCESS:", excessLetters, "ALLCORRECT:", allCorrectlyTypedLetters, "ALLTOTYPE:", allLettersToType);
      console.log(
        "RAW:",
        rawWpm.toFixed(2),
        "WPM:",
        wpm.toFixed(2),
        "FINAL ACC:",
        (finalAccuracy * 100).toFixed(2) + "%",
      );

      client?.nextSentence(rawWpm, wpm, finalAccuracy);
    }

    if (currentInput[currentInput.length - 1]?.toLowerCase() == "rick") {
      goto("/rick");
    }
  }

  onMount(async () => {
    // Initialize game state for the specific game code
    createClient(gameCode).then((conn) => (client = conn));

    gameLink = `${window?.location?.origin}/${gameCode}`;
  });

  $effect(() => {
    if (!client) {
      return;
    }

    client.connect("scribe");
    client.on("connect", (msg) => {
      if (msg.role == "scribe") client?.start(1200);
    });

    client.on("game_state", (msg) => {
      isPlaying = msg.inPlay;
      updateGameState(msg);
      if (msg.inPlay) {
        endsAt = msg.currentState.endsAt;
      }
    });
  });
</script>

<svelte:head>
  <title>Fast Scribe | Scribe</title>
</svelte:head>

<svelte:body onkeydown={handleInput} />
<div class="absolute top-0 right-0 flex flex-col items-end justify-center p-4">
  
  <p class="text-align-center font-bold">Join the game! <code class="bg-secondary p-1 rounded ml-2">{gameLink}/{gameCode}</code></p>
    <div class="flex items-center justify-center mt-4">
    <div class="rounded w-40 ">
      <svg
        use:qr={{
          data: `${gameLink}/${gameCode}`,
          shape: "circle",
          anchorInnerFill: "white",
          anchorOuterFill: "white",
          moduleFill: "white",
        }}
      />
    </div>
  </div>

</div>

<div class="flex flex-col items-center justify-center h-screen">

  <h1 class="text-3xl font-bold mb-4">Fast Scribe - Game Code: {gameCode}</h1>
  <div
    class="flex flex-col items-left justify-center gap-2 w-full max-w-[80ch] overflow-x-hidden h-[12ex] rounded bg-accent"
  >
    {#each gameState.gameSentences
      .entries()
      .toArray()
      .slice(Math.max(gameState.sentenceNumber - 1, 0), gameState.sentenceNumber + 2) as all (all[0])}
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
          active={true_index === gameState.sentenceNumber}
          hideTruth={true_index >= gameState.sentenceNumber}
          showStats={gameState.stats[true_index]}
        />
      </div>
    {/each}
  </div>

  <div class="pt-5">
    <TimeRemainingText ends-at={endsAt} />
  </div>
</div>
