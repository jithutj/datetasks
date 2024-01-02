<script lang="ts">
	import { goto } from '$app/navigation';
	import Button, { Icon } from '@smui/button';
	import Paper, { Content } from '@smui/paper';
	import { tick } from 'svelte';
	import Database from '$lib/Database';
	import _ from 'lodash';
	import type { TODO } from '$lib/types';
	import { convertToReadableDateTime } from '$lib/utils/date';
	import type { LocalNotificationDescriptor } from '@capacitor/local-notifications';
	import { NotificationService } from '$lib/utils/NotificationService';

	export let data;

	let notifications: TODO[] = [];

	const db = Database.getInstance().getDB();

	$: data.pendings.notifications.length &&
		(async (notificationsArray) => {
			const extraCombinedArray = _.map(notificationsArray, (item) =>
				_.assign({}, item, item.extra)
			);
			/* const todoIdsAndTaskIds = _.map(notificationsArray, 'extra'); */
			const uniqueIds = _.uniqBy(extraCombinedArray, _.values);
			const results = uniqueIds.map(async ({ id, body, schedule, todoId }, i) => {
				try {
					const { docs } = await db.find({
						selector: {
							_id: { $eq: todoId }
						},
						limit: 1
					});
					await tick();
					//@ts-ignore
					let todo: TODO = [];
					//@ts-ignore
					if (docs.length) {
						//@ts-ignore
						todo = docs[0];
					} else {
						todo = {
							_id: todoId,
							_rev: '',
							date: '',
							desc: body,
							isDone: false,
							remScheduleId: id,
							remSchedule: schedule.at
						};
					}
					return todo;
				} catch (error) {
					return null;
				}
			});
			await tick();

			if (results && results.length > 0) {
				Promise.all(results).then((docs) => {
					const filterDocs = docs.filter((element) => element !== null);
					if (filterDocs.length) {
						//@ts-ignore
						notifications = filterDocs.map((doc) => {
							return doc;
						});
					}
				});
			}
		})(data.pendings.notifications);

	const cancelNotification = async (
		e: any,
		notificationId: LocalNotificationDescriptor[],
		todoId: string
	) => {
		const notificationService = NotificationService.getInstance();
		try {
			await notificationService.cancel(notificationId);
			await tick();
			const doc = await db.get(todoId);
			const taskRemScheduleDefaults = {
				remScheduleId: null,
				remSchedule: null,
				isRemNotified: false,
				remScheduleRepeats: false,
				remScheduleEvery: null
			};
			const newDoc = Object.assign({ ...doc, ...taskRemScheduleDefaults });
			await db.put(newDoc);
			await tick();
			// Change the text content of the Label
			e.target.textContent = 'Cancelled';
		} catch (err) {
			alert("Something went wrong, can't cancel.try again");
		}
	};
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<h2 class="text-2xl text-red-500 font-semibold flex items-center">
	<Icon class="material-icons">notifications</Icon>{data.title}
</h2>
{#if notifications.length}
	<div class="paper-container">
		{#each notifications as notification}
			{#if notification.remSchedule || notification.remScheduleId}
			<Paper class="mb-2">
				<Content>
					<p class="mb-5">{_.truncate(notification.desc, { length: 103, omission: '...' })}</p>
					{#if notification.remSchedule}
						<p class="flex items-center justify-end text-green-600 text-xs mb-4">
							<Icon class="material-icons">notifications</Icon>
							{convertToReadableDateTime(notification.remSchedule)}
						</p>
					{/if}
					{#if notification._rev !== ''}
						<p class="flex justify-end items-center">
							<Button variant="outlined" on:click={() => goto(`/task?todoid=${notification._id}`)}
								><Icon class="material-icons">visibility</Icon> VIEW</Button
							>
						</p>
					{/if}
					{#if notification._rev === ''}
						<p class="flex justify-end mt-3">
							<span class="text-red-500 text-xs">[Deleted note]</span>
						</p>
					{/if}
					{#if notification.remScheduleId}
						<button
							class="btn btn-outline btn-accent text-red-600"
							on:click={(e) =>
								notification.remScheduleId &&
								cancelNotification(
									e,
									[
										{
											id: notification.remScheduleId
										}
									],
									notification._id
								)}>Cancel</button
						>
					{/if}
				</Content>
			</Paper>
			{/if}
		{/each}
	</div>
{:else}
	<p>No upcoming reminders...</p>
{/if}
<Button class="mt-5" variant="raised" on:click={() => goto('/')}>
	<Icon class="material-icons">arrow_back</Icon>
	Go Back to Home
</Button>
