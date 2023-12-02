<script>
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content, Title } from '@smui/paper';


	export let data;
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<Title>{ data.title }</Title>
{#await data.pendings}
<p>Loading...</p>
{:then value}
	{#if value.length}
	<div class="paper-container">
		<Paper>
		  <Title>{value.title}</Title>
		  <Content>{value.body}</Content>
		</Paper>
	  </div>
	{:else}
		<p>No upcoming reminders</p>
	{/if}
{:catch error}
	<!-- promise was rejected -->
	<p>Something went wrong: {error.message}</p>
{/await}
<Button class="mt-5" variant="raised" on:click={ () => goto('/') }> 
	<Icon class="material-icons">arrow_back</Icon>
	Go Back to Home
</Button>