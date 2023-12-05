<script>
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content, Title } from '@smui/paper';
  import { formatDateReadable } from "$lib/utils/date";
  
    export let data;
</script>

{#if data.taskData}
<div class="paper-container">
    <Paper>
      <Title>{formatDateReadable(data.taskData.date)}</Title>
      <Content>{data.taskData.desc}</Content>
    </Paper>
    <Button class="mt-5" variant="raised" on:click={ () => goto('/') }> 
        <Icon class="material-icons">arrow_back</Icon>
        Go Back to Home
    </Button>
  </div>
{/if}