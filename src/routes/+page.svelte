<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>


<script>

  import {onMount} from 'svelte';
  import skio from 'sveltekit-io';

  onMount(() => {

    const socket = skio.get();

    socket.on('message', message => {
      console.log("Server sent:", message);
    });

    socket.emit('message', {message: 'Hello from client !'});
  });

</script>