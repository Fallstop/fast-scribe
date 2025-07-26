<script module lang="ts">
  export interface Props {
    currentText: string[];
    targetText: string[];
    active: boolean;
  }
</script>

<script lang="ts">
  import { gameState } from "$lib/state.svelte";

  import { Tween } from "svelte/motion";


  const { currentText, targetText, active } = $props();

  const combinedText = $derived<string[]>(
    targetText.map((word: string, wordIndex: number) => {
      const currentWord = currentText[wordIndex] || "";
      return word.length > currentWord.length
        ? word
        : word + currentWord.slice(word.length, currentWord.length);
    })
  );

  function decideClass(wordIndex: number, charIndex: number) {
    if (
      currentText.length <= wordIndex ||
      currentText[wordIndex].length <= charIndex
    ) {
      return "incomplete";
    }
    if (
      wordIndex >= targetText.length ||
      charIndex >= targetText[wordIndex].length
    ) {
      return "extra-incorrect";
    }

    if (
      currentText[wordIndex][charIndex] === targetText[wordIndex][charIndex]
    ) {
      return "correct";
    } else {
      return "incorrect";
    }
  }

  interface CursorPosition {
    x: number;
    y: number;
  }

  const cursorPosition = new Tween<CursorPosition>(
    {
      x: 0,
      y: 0,
    },
    {
      duration: 100,
    }
  );

  $effect(() => {
    const cursor = getCursorPosition(targetText, currentText);
    cursorPosition.set(cursor);
  });

  function getCursorPosition(
    targetText: string[],
    currentText: string[]
  ): CursorPosition {
    if (currentText.length === 0) {
      return { x: 0, y: 0 };
    }

    const lastWordIndex = currentText.length - 1;
    const lastWord = currentText[lastWordIndex];

    const cursorPosition: CursorPosition = {
      x: 1,
      y: 0,
    };

    // calculate the distance covered
    combinedText.forEach((word, index) => {
      if (index < lastWordIndex) {
        cursorPosition.x += word.length + 1; // +1 for space
      } else if (index === lastWordIndex) {
        cursorPosition.x += lastWord.length;
      }
    });

    return cursorPosition;
  }
</script>

<div
  class="relative bg-secondary p-4 rounded-lg shadow-md text-2xl font-mono text-primary w-4xl"
  class:not-active={!active}>
 
  <span
    class="cursor"
    class:hidden={currentText.length == 0 ||
      (currentText.length == 1 && currentText[0].length == 0)}
    style="transform: translateX({cursorPosition.current
      .x}ch) translateY({cursorPosition.current.y}ch);"></span>
  {#each combinedText as word, wordIndex}
    <span class="word">
      {#each word.split("") as char, charIndex}
        <span class="char {decideClass(wordIndex, charIndex)}">
          {char}
        </span>
      {/each}
    </span>
    {#if wordIndex < combinedText.length - 1}
      <span class="space"> </span>
    {/if}
  {/each}
</div>

<style lang="scss">
  .char {
    &.correct {
      color: white;
    }
    &.incorrect {
      color: red;
    }
    &.incomplete {
      color: gray;
    }
    &.extra-incorrect {
      color: darkred;
    }
  }

  .not-active {
    opacity: 0.5;

    .cursor {
      opacity: 0;
    }
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background-color: #ffd700;
    margin-left: 1px;
    position: relative;
    top: 0.1em;
    &.hidden {
      opacity: 0;
    }
  }

  .word {
    position: relative;
  }

  .space {
    white-space: pre;
  }
</style>
