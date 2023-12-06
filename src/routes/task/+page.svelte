<script lang="ts">
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content, Title } from '@smui/paper';
  import { convertToReadableDateTime, formatDateReadable, isGreaterThanOrEqToday } from "$lib/utils/date";
	import { beforeUpdate, onMount, tick } from 'svelte';
  import Database from '$lib/Database';
  import type { TODO } from '$lib/types';
  import { page } from '$app/stores';
	import _ from 'lodash';

  let taskData: TODO | null = null;

  let todoId: string = '';
  beforeUpdate(() => {
    if ($page.url.searchParams.get('todoid')) {
      //@ts-ignore
      todoId =  $page.url.searchParams.get('todoid');
    }
  });

  onMount(async () => {
	if (todoId) {
        try {
          const db = Database.getInstance().getDB();
          //@ts-ignore
          taskData = await db.get(todoId);

        } catch (err) {
          console.log(err);
        }
      }
  }) 
</script>

{#if taskData}
{#await taskData}
	<p>...loading</p>
{:then value}
<div class="paper-container">
<Button class="mt-5" variant="raised" on:click={ () => history.back() }> 
  <Icon class="material-icons">arrow_back</Icon>
  Go Back
</Button>
<Button class="mt-5" variant="raised" on:click={ () => goto('/') }> 
    <Icon class="material-icons">home</Icon>
    Home
</Button>
  <Paper class="mt-3">
    <Title>{formatDateReadable(value.date)}</Title>
    <Content>
      
      {#if value.remSchedule && isGreaterThanOrEqToday(value.remSchedule)}
      <div class="flex flex-col mb-4 items-end">
        <p class="flex flex-col items-end"><span><Icon class="material-icons text-base">notifications</Icon> Reminder Scheduled at:-</span> <b class="text-green-600">{convertToReadableDateTime(value.remSchedule)}</b
        ></p>
        {#if value.remScheduleRepeats}
        <p class="flex justify-end">
          Repeat every: &nbsp <b>{value.remScheduleEvery && _.capitalize(value.remScheduleEvery)}</b>
        </p>
        {/if}
        </div>
      {/if}
      <p>{value.desc}</p>
    </Content>
  </Paper>
</div>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
{/if}