<script lang="ts">
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content, Title } from '@smui/paper';
	import { tick } from 'svelte';
	import Database from "$lib/Database";
	import _ from 'lodash';
	import type { TODO } from '$lib/types';
	import { convertToReadableDateTime } from '$lib/utils/date';

	export let data;

	let notifications: TODO[] = [];

	const db = Database.getInstance().getDB();

	
	$: data.pendings.notifications.length && (async (notificationsArray) => {

		const todoIdsAndTaskIds = _.map(notificationsArray, 'extra');
		const uniqueIds = _.uniqBy(todoIdsAndTaskIds, _.values);
		
		const results = uniqueIds.map(async ({ todoId, taskId }, i) => {
			try {
				const result = await db.find({
				selector: {
					_id: { $eq: todoId },
				},
				fields: ['_id', '_rev', 'dateIso', 'tasks'],
				limit: 1
				});
				await tick();
				if (result.docs.length > 0) {
					//@ts-ignore
					let todo: TODO = _.omit(result.docs[0], 'tasks');
					//@ts-ignore
					const tasks = result.docs[0].tasks.find(task => task.id === taskId);
					todo.tasks = [tasks];
					return todo;
				} else {
					// Task not found
					return null;
				}

			} catch (error) {
				return null;
			}
		});
		await tick()
		
		if (results && results.length) {
			Promise.all(results).then(docs => {
				//@ts-ignore
				notifications = docs.map(doc => {
					return doc;
				})
			})
		}
		
	})(data.pendings.notifications);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<h2 class="text-2xl text-red-500 font-semibold flex items-center"><Icon class="material-icons">notifications</Icon>{ data.title }</h2>
{#if notifications.length}
<div class="paper-container">
{#each notifications as { _id, tasks }}
{#each tasks as { id, desc, remSchedule }}
<Paper class="mb-2">
	<Content>
			<p class="mb-5">{_.truncate(desc, { length: 103, omission: '...' })}</p>
			{#if remSchedule}
			<p class="flex items-center justify-end text-green-600 text-xs mb-4"><Icon class="material-icons">notifications</Icon> {convertToReadableDateTime(remSchedule)}</p>
			{/if}
			<p class="flex justify-end items-center"><Button variant="outlined" on:click={() => goto(`/task?todoid=${_id}&taskid=${id}`)}><Icon class="material-icons">visibility</Icon> VIEW</Button></p>
	</Content>
  </Paper>
{/each} 
{/each}
</div>
{:else}
<p>No upcoming reminders...</p>
{/if} 
<Button class="mt-5" variant="raised" on:click={ () => goto('/') }> 
	<Icon class="material-icons">arrow_back</Icon>
	Go Back to Home
</Button>