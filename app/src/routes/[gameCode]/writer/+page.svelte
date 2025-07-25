<script lang="ts">
  import { onMount } from "svelte";
    import type { PageProps} from "./$types"
  import { Input } from "$lib/components/ui/input";
    const porps: PageProps = $props();
    const gameCode = $derived(porps.params.gameCode);

    // get game code from URL

    let text_value = $state("");
    let cursor_position = $state(0);
    
    let textBox: HTMLInputElement | null = null;
    
    function forceFocus() {
        if (!textBox) {
            return;
        }
        textBox.focus();
    }

    onMount(() =>{
        forceFocus();
    })
</script>
<div class="flex flex-col items-center justify-center h-screen">
  <h1 class="text-3xl font-bold mb-4">Fast Scribe - Game Code: {gameCode}</h1>
    <p class="mb-8">debug data: {text_value} {cursor_position}</p>
    <Input bind:ref={textBox} onblur={forceFocus} class="max-w-xs" bind:value={text_value} onselectionchange={(event)=>{
        cursor_position = textBox?.selectionStart ?? cursor_position

    }} />
</div>