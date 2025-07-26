<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    onMount(() => {
        const timer = setTimeout(() => {
            window.history.back();
        }, 250);
    });
</script>

<div class="flex flex-col items-center justify-center h-screen">
    <img src="rick.gif" alt="rick" style="width: 40vw;">
</div>

