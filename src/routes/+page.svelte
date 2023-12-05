<script lang="ts">
	import { TaskComponent, Database, Popup, confirmPopup, type todoTypes } from '$lib';
	import type { GroupedByDate, TODO } from '$lib/types';
	import {
		combineDateAndTime,
		combineDateAndTimeDirect,
		convertToReadableDateTime,
		formatDateISO,
		formatDateOnly,
		formatDateReadable,
		formatDateRegular,

		isGreaterThanOrEqToday

	} from '$lib/utils/date';
	import { onMount, tick } from 'svelte';
	import _ from 'lodash';
	import { toast } from '@zerodevx/svelte-toast';
	import '../todo.css';
	import Accordion, { Header, Panel } from '@smui-extra/accordion';
	import { mdiPlus } from '@mdi/js';
	import Fab, { Icon } from '@smui/fab';
	import { default as MaterialButton } from '@smui/button';
	import { error } from '@sveltejs/kit';
	import AirDatepicker from 'air-datepicker';
	import AirDatelocaleEn from 'air-datepicker/locale/en';
	import { ListenerEvents, NotificationService } from '$lib/utils/NotificationService';
	import 'air-datepicker/air-datepicker.css';
	import Dialog, { Actions, Content, Title } from '@smui/dialog';
	import IconButton from '@smui/icon-button';
	import Textfield from '@smui/textfield';
	import FormField from '@smui/form-field';
	import { getRandomNumberString, indexResultGroupByDate, mergeNewObject, removeBatchObject, removeObject } from '$lib/utils/common';
	import Select, { Option } from '@smui/select';
	import { Switch } from '@svelteuidev/core';
	import { invalidateAll } from '$app/navigation';
	import type {
		ActionPerformed,
		LocalNotificationDescriptor,
		LocalNotificationSchema
	} from '@capacitor/local-notifications';
	import { goto } from '$app/navigation';

	const db = Database.getInstance().getDB();
	const notificationService = NotificationService.getInstance();

	export let data;

	let todos: GroupedByDate[] = [];
	let todoPrevPaginationStartid: string | null = null;
	let todoNextPaginationStartid: string | null = null;
	const todayDate = new Date();
	const today = formatDateOnly(todayDate);

	const DATE_PLACEHOLDER = 'Choose date';

	const taskRemScheduleDefaults = {
		remScheduleId: null,
		remSchedule: null,
		isRemNotified: false,
		remScheduleRepeats: false,
		remScheduleEvery: null
	};
	const taskSaveDataDefault = {
		_id: '',
		date: '',
		desc: '',
		isDone: false,
		...taskRemScheduleDefaults
	};
	let taskSaveData: TODO = { ...taskSaveDataDefault };

	//@ts-ignore
	$: if (data.todos) {
		//@ts-ignore
		todos = data.todos.length ? indexResultGroupByDate(data.todos) : [];
	}

	/* $: if (todos.length) {
		setMoreStartEndIds();
	} */
	let openPopup = false;
	const scheduleEvery = ['week', 'day', 'month', 'hour', 'minute', 'year'];
	// Array for hours (01 to 12)
	let hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
	// Array for minutes (00 to 59)
	let minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

	let remHour: string;
	let remMin: string = '00';
	let remAmPm: string = 'AM';
	let oldRemSchedule = null;

	let datePickerInstance: any;

	$: if (taskSaveData.date && remHour && remMin && remAmPm) {
		const remScheduleTime = `${remHour}:${remMin} ${remAmPm}`;
		const remScheduleDate = taskSaveData.date;
		taskSaveData.remSchedule = combineDateAndTimeDirect(remScheduleDate, remScheduleTime);
	}

	$: if (taskSaveData.date !== '') {
		if (!datePickerInstance.selectedDates.length) {
			datePickerInstance.selectDate(taskSaveData.date);
		}
	}

	onMount(async () => {

		setTimeout(() => {
			notificationService.checkOrRequestPermission();
		}, 3000);

		notificationService.registerActionTypes([
			{
				id: 'reminder',
				actions: [
					{
						id: 'view',
						title: 'View'
					}
				]
			}
		]);

		notificationService.createChannel({
			id: 'notespro-reminder',
			name: 'Notespro reminder notifications',
			description: 'Reminder notification channel',
			importance: 5, // High importance
			sound: 'smart_alarm.mp3',
			visibility: 1, // Heads-up notification
			vibration: true,
			lights: true
		});

		datePickerInstance = new AirDatepicker('#add-date', {
			isMobile: true,
			locale: AirDatelocaleEn,
			autoClose: true,
			onSelect: ({ date }) => {
				if (date) {
					//@ts-ignore
					taskSaveData.date = formatDateOnly(new Date(date));
				}
			}
		});
	});
	/** onMount end */

	const scheduleNotification = async (isAdd: boolean = true, prevTodo: TODO) => {
		const notificationService = NotificationService.getInstance();
		if (
			taskSaveData.remSchedule &&
			(isAdd ||
				(prevTodo &&
					(null === prevTodo.remSchedule || prevTodo.remSchedule !== taskSaveData.remSchedule)))
		) {
			notificationService.checkOrRequestPermission();
			if (taskSaveData.remScheduleId) {
				alert(taskSaveData.remScheduleId);
				let notifyPayload: LocalNotificationSchema = {
						id: taskSaveData.remScheduleId,
						title: taskSaveData.desc.substring(0, 15),
						body: taskSaveData.desc.substring(0, 150),
						schedule: {
							at: new Date(taskSaveData.remSchedule),
							allowWhileIdle: true,
							repeats: taskSaveData.remScheduleRepeats
							// every: 'minute'
						},
						autoCancel: true,
						extra: { type: 'reminder', todoId: taskSaveData._id },
						channelId: 'notespro-reminder',
						actionTypeId: 'reminder'
				}
				if (taskSaveData.remScheduleEvery) {
					//@ts-ignore
					notifyPayload.schedule.every = taskSaveData.remScheduleEvery;
				}
				notificationService.scheduleNotification([
					notifyPayload
				]);

				notificationService.addListeners<ActionPerformed>(
					ListenerEvents.localNotificationActionPerformed,
					async (notificationAction) => {
						if (
							notificationAction.actionId === 'view' &&
							notificationAction.notification.extra.type === 'reminder'
						) {
							goto(
								`/task?todoid=${notificationAction.notification.extra.todoId}`
							);
						}
					}
				);
			}
			await tick()
			return true;
		}	
	};

	const cancelNotification = async () => {
		const notificationService = NotificationService.getInstance();
		alert('enter 0')
		alert(JSON.stringify(taskSaveData))
		if (taskSaveData.remScheduleId) {
			alert('enter 1')
			alert(taskSaveData.remScheduleId)
			await notificationService.cancel([
				{
					id: taskSaveData.remScheduleId
				}
			]);
			await tick();
			taskSaveData = Object.assign({ ...taskSaveData, ...taskRemScheduleDefaults });
		}
	};

	const removeDate = async (date: string) => {
		try {
		const {docs} = await db.find({
			selector: { date }
		});
		await tick()
		let ids: [] = [];
		docs.map(doc => {
			db.remove(doc);
			//@ts-ignore
			ids.push(doc._id)
		})
		//@ts-ignore
		data.todos = removeBatchObject(data.todos, ids);
		} catch (err) {
			console.log(err);
		}
	}

	const removeTodo = async (todoId: TODO['_id'], todoRev: TODO['_rev']): Promise<void> => {
		try {
			//@ts-ignore
			await db.remove(todoId, todoRev);
			await tick();
			//@ts-ignore
			data.todos = removeObject(data.todos, todoId);
		} catch (err) {
			console.log(err);
		}
	};

	const getMoreDates = async (type: 'prev' | 'next' = 'prev') => {
		switch (type) {
			case 'next':
				const { docs: nextDocs } = await db.find({
					selector: { _id: { $gte: todoNextPaginationStartid } },
					sort: [{ _id: 'asc' }],
					limit: 5
				});
				await tick();
				//@ts-ignore
				todos = _.orderBy([...nextDocs, ...todos], ['_id']);
				break;
			default:
				const { docs: prevDocs } = await db.find({
					selector: { _id: { $lte: todoPrevPaginationStartid } },
					sort: [{ _id: 'desc' }],
					limit: 5
				});
				await tick();
				//@ts-ignore
				todos = _.orderBy([...todos, ...prevDocs], ['_id']);
		}
	};

	const setMoreStartEndIds = async () => {
		const currentStartId = _.get(todos, '[0]._id');
		const currentEndId = _.maxBy(todos, '_id')?._id;

		const { docs: prevDocsMore } = await db.find({
			selector: { _id: { $lt: currentStartId } },
			sort: [{ _id: 'desc' }],
			limit: 2
		});

		const { docs: nextDocsMore } = await db.find({
			selector: { _id: { $gt: currentEndId } },
			sort: [{ _id: 'asc' }],
			limit: 2
		});

		await tick();

		todoPrevPaginationStartid = prevDocsMore.length ? prevDocsMore[0]._id : null;
		todoNextPaginationStartid = nextDocsMore.length ? nextDocsMore[0]._id : null;
	};

	const toggleCompleted = async (e: CustomEvent, todo: TODO): Promise<void> => {
		try {
		await db.put(todo);
		}catch(err) {
			console.log(err);
		}
	};

	//@ts-ignore
	async function handleSaveTodo(e) {
		if (taskSaveData.date && taskSaveData.desc) {
			//add new - assign id
			let isAdd = false;
			if (taskSaveData._id === '') {
				isAdd = true;
				taskSaveData._id = Date.now().toString();
			}
			try {
				let prevTodo: TODO | null = null;
				if (!isAdd) {
					prevTodo = await db.get(taskSaveData._id);
				}
				taskSaveData.remScheduleId = isAdd ? getRandomNumberString(7) : (prevTodo && (prevTodo.remScheduleId ?? getRandomNumberString(7)));
				const response = await db.put(taskSaveData);
				await tick();
				if (response.ok) {
					const updatedTodo = await db.get(response.id);
					await tick();
					//@ts-ignore
					scheduleNotification(isAdd, prevTodo);
					await tick()
					taskSaveData = { ...taskSaveDataDefault };
					if (datePickerInstance) {
						datePickerInstance.clear();
					}
					openPopup = false;
					//@ts-ignore
					data.todos = mergeNewObject(data.todos, updatedTodo);
					// invalidateAll();
				}
			} catch (err) {
				console.log(err);
				toast.push('Saving failed, Something went wrong. Please try again');
			}
		} else {
			toast.push('Please enter required fields', {
				classes: ['warn']
			});
		}
	}
</script>

<section id="dt-todo-container" class="dt-todo-container">
	<div class="dt-todo-task-container">
		{#if todoPrevPaginationStartid}
			<MaterialButton on:click={() => getMoreDates('prev')}
				><Icon class="material-icons">arrow_back_ios</Icon> Show Previous</MaterialButton
			>
		{/if}
		<div class="accordion-container">
			<Accordion multiple>
				{#each todos as todo}
					{#each Object.entries(todo) as [date, content], i}
						<Panel open={true} class="!rounded-sm !pb-4">
							<Header>
								<div class="flex items-center">
									<div class="w-11/12">
										{formatDateReadable(date)}
									</div>
									<div class="w-1/12 flex justify-end">
										<IconButton
											class="material-icons !px-0 flex justify-end"
											on:click={() => {
												confirmPopup(
												'Remove Date',
												'All contents inside date will be lost, are you sure you want to delete date?',
												() => removeDate(date)
											);
											}}
										>
											delete
										</IconButton>
									</div>
								</div>
							</Header>
							{#each content as data}
								<TaskComponent
									todo={data}
									bind:taskSaveData
									bind:openPopup
									removeTodo={removeTodo}
									toggleCompleted={toggleCompleted}
								/>
							{/each}
							<div class="flex justify-end px-7">
								<MaterialButton
									color="primary"
									variant="unelevated"
									on:click={() => {
										taskSaveData = { ...taskSaveDataDefault };
										taskSaveData.date = date;
										openPopup = true;
									}}
								>
									<Icon class="material-icons">add</Icon> Add Note
								</MaterialButton>
							</div>
						</Panel>
					{/each}
				{/each}
			</Accordion>
		</div>
		{#if todoNextPaginationStartid}
			<div class="flex justify-end">
				<MaterialButton on:click={() => getMoreDates('next')}
					>Show More <Icon class="material-icons">arrow_forward_ios</Icon></MaterialButton
				>
			</div>
		{/if}
		<div class="flexy z-20 fixed bottom-7 left-1/2 transform -translate-x-1/2">
			<div class="margins">
				<Fab on:click={() => (openPopup = true)}>
					<Icon tag="svg" viewBox="2 2 20 20">
						<path fill="currentColor" d={mdiPlus} />
					</Icon>
				</Fab>
			</div>
		</div>
	</div>
</section>
<Dialog
	bind:open={openPopup}
	aria-labelledby={`todo-popup-title`}
	aria-describedby={`todo-popup-content`}
	surface$style="width: 100%; height: 100%; min-width: 100vw; overflow-x: hidden"
	class="z-50"
>
	<div class="flex justify-end">
		<Actions>
			<IconButton class="material-icons text-red-500" on:click={() => (openPopup = false)}
				>close</IconButton
			>
		</Actions>
	</div>
	<Content class="!px-1">
		<div class="px-3">
			<div class="flex flex-col">
				<h3 class="font-semibold">Schedule Reminder</h3>
				<div class="flex flex-wrap">
					<div class="w-5/12">
						<Select invalid={!remHour} bind:value={remHour} label="Select Hour">
							<Option value="" />
							{#each hours as hour}
								<Option value={hour}>{hour}</Option>
							{/each}
						</Select>
					</div>
					<div class="w-4/12">
						<Select bind:value={remMin} label="Select Minute">
							{#each minutes as min}
								<Option value={min}>{min}</Option>
							{/each}
						</Select>
					</div>
					<div class="w-3/12">
						<Select bind:value={remAmPm} label="AM/PM">
							<Option value="AM">AM</Option>
							<Option value="PM">PM</Option>
						</Select>
					</div>
				</div>
			</div>
			<div class="flex items-center">
				<div class="w-6/12">
				<Switch
					class="mr-3"
					label="Repeats"
					bind:checked={taskSaveData.remScheduleRepeats}
					size="md"
					onLabel="ON"
					offLabel="OFF"
				/>
			</div>
			<div class="w-6/12">
				<Select bind:value={taskSaveData.remScheduleEvery} label="Repeat Interval">
					{#each scheduleEvery as every}
						<Option value={every}>{every}</Option>
					{/each}
				</Select>
			</div>
			</div>
			<div class="my-3">
				{#if taskSaveData.remSchedule}
					<p>Scheduled at: <b class="text-green-600">{convertToReadableDateTime(taskSaveData.remSchedule)}</b></p>
				{/if}
			</div>
			<div class="flex justify-end px-3 items-end flex-col">
				{#if taskSaveData.remSchedule && isGreaterThanOrEqToday(taskSaveData.remSchedule)}
					<div class="flex justify-center columns margins">
						<MaterialButton
							on:click={() => {
								confirmPopup(
									'Cancel Reminder',
									'You no longer receive reminder if you press cancel?',
									() => cancelNotification(),
									'No',
									'Cancel'
								);
							}}>Cancel Reminder</MaterialButton
						>
					</div>
				{:else}
					<span>No Reminder Set</span>
				{/if}
			</div>
			<div class="flex justify-between items-end w-full my-7">
				<div class="flex items-end">
					<Icon class="material-icons mr-2" slot="leadingIcon">event</Icon>
					<input
						class="py-2 px-2 border-b-2 pb-1 text-black"
						class:border-red-500={!taskSaveData.date}
						type="text"
						id="add-date"
						placeholder={DATE_PLACEHOLDER}
					/>
					<input type="hidden" name="date" bind:value={taskSaveData.date} />
				</div>
				<div class="flex">
					<MaterialButton on:click={handleSaveTodo} variant="raised">Save</MaterialButton>
				</div>
			</div>
			<div>
				<Textfield
					style="width: 100%;height: 40vh"
					helperLine$style="width: 100%;"
					textarea
					bind:value={taskSaveData.desc}
					label="Description"
					invalid={taskSaveData.desc === ''}
				/>
			</div>
		</div>
	</Content>
</Dialog>
<Popup />
