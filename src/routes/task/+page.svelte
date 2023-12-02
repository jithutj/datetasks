<script>
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content, Title } from '@smui/paper';

    export let data;
</script>

{#if data.taskData}
<div class="paper-container">
    <Paper>
      <Title>{data.taskDate}</Title>
      <Content>{data.taskData.desc}</Content>
    </Paper>
    <Button class="mt-5" variant="raised" on:click={ () => goto('/') }> 
        <Icon class="material-icons">arrow_back</Icon>
        Go Back to Home
    </Button>
  </div>
{/if}