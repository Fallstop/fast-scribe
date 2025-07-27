<script lang="ts">
  const { "ends-at": endsAt }: { "ends-at": number } = $props();
  const formatTime = (remaining: number) => {
    let secondsTotal = Math.floor(remaining / 1000);
    let minutes = Math.floor(secondsTotal / 60);
    let seconds = secondsTotal - minutes * 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  let timeRemaining = $state(new Date().getTime() - endsAt);
  const formattedTime = $derived(formatTime(timeRemaining));

  $effect(() => {
    let interval = setInterval(() => {
      timeRemaining = endsAt - new Date().getTime();
      if (timeRemaining < 0) {
        timeRemaining = 0;
        clearInterval(interval);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<span class="font-bold text-yellow-600 text-2xl">
  {formattedTime}
</span>
