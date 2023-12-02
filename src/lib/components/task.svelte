<script lang="ts">
	import { Database } from '$lib';
	import type { TODO, Task } from '$lib/types';
	import _, { add } from 'lodash';
	import {
		combineDateAndTime,
		convertToReadableDateTime,
		formatDateOnly,
		formatDateReadable,
		formatDateRegular,
		isGreaterThanOrEqToday
	} from '$lib/utils/date';
	import { Menu, NativeSelect } from '@svelteuidev/core';
	//@ts-ignore
	import { Panel, Header, Content as AccordionContent } from '@smui-extra/accordion';

	import IconButton, { Icon } from '@smui/icon-button';
	import { default as MaterialMenu } from '@smui/menu';
	import List, { Item, Text, Meta, Graphic } from '@smui/list';
	import Textfield from '@smui/textfield';
	import { Label, default as MaterialButton } from '@smui/button';
	import Checkbox from '@smui/checkbox';
	import Dialog, { Title, Content as DialogContent, Actions } from '@smui/dialog';
	import AirDatepicker from 'air-datepicker';
	import AirDatelocaleEn from 'air-datepicker/locale/en';
	import { tick } from 'svelte';
	import { error } from '@sveltejs/kit';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { NotificationService } from '$lib/utils/NotificationService';
	import { ListenerEvents } from '$lib/utils/NotificationService';
	import { Dialog as CapDialog } from '@capacitor/dialog';
	import { getRandomNumberString } from '$lib/utils/common';
	import type { ActionPerformed, LocalNotificationDescriptor, LocalNotificationSchema } from '@capacitor/local-notifications';
	import { TimePickerModal } from 'svelte-time-picker';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { Switch } from '@svelteuidev/core';
	import Select, { Option } from '@smui/select';

	export let todos: TODO[];
	export let todo: TODO;
	export let isOpen: boolean;
	export let removeTodo: (todoId: TODO['_id']) => void;
	export let createTodo: any;

	const db = Database.getInstance().getDB();

	let viewMode: boolean = false;
	let editMode: boolean = false;
	let editId: number = 0;
	let editIds: number[] = []; // inline edit ids
	let inlineLastEditId: number = 0;
	let addMode: boolean = false;
	// let textElem: { [key: number]: HTMLTextAreaElement } = {};
	let todoClone: TODO | null = todo;
	let triggerSync = false;

	type TaskSaveData = Partial<Omit<Task, 'desc'>> & { desc: Task['desc'] };
	const taskRemScheduleDefaults = {
		remScheduleId: getRandomNumberString(7),
		remSchedule: null,
		isRemNotified: false,
		remScheduleRepeats: false,
		remScheduleEvery: null
	}
	const taskSaveDataDefault = {
		desc: '',
		...taskRemScheduleDefaults
	};
	let taskSaveData: TaskSaveData = taskSaveDataDefault;

	let isTaskDateEditChanged = false;
	let taskDateChangeDestTodo: TODO | null = null;
	let taskChangeEditDate: Date | null = null;
	let taskChangeAddDate: Date | null = null;
	let isTaskDateAddChanged = false;
	$: if (openPopup) {
		isTaskDateEditChanged = false;
		taskChangeEditDate = null;
		taskChangeAddDate = null;
		isTaskDateAddChanged = false;
	}

	let isTaskDateEditCalnderOpen = false;

	let isTaskReminderTimerOpen = false;
	const timerOptions = {
		/* Global colors */
		bgColor: '#2b6cb0',
		/* Components styles */
		buttonClassName: 'timer-buttons-button',
		buttonBarClassName: 'timer-buttons-bar',
		timeClassName: 'timer-buttons-time',
		clockClassName: 'timer-clock-container',
		/* Options */
		hasButtons: true,
		zIndex: 200
		// minutesIncrement: 5
	};
	const scheduleEvery = ['week', 'day', 'month', 'hour', 'minute', 'year'];
	let remCancel: LocalNotificationDescriptor[] = [];

	$: _selectedTimer = taskSaveData.remSchedule ? new Date(taskSaveData.remSchedule) : new Date();

	const persistState = async () => {
		try {
			if (todoClone) {
				const { rev } = await db.put(todoClone);
				todoClone._rev = rev;
				if (!isTaskDateEditChanged && !isTaskDateAddChanged) {
					todo = todoClone;
				} else if (isTaskDateEditChanged) {
					const t_index = todos.findIndex((item) => item._id === todoClone?._id);
					const index = todoClone.tasks.findIndex((task) => task.id === editId);
					todos[t_index].tasks[index] = todoClone.tasks[index];
				} else if (isTaskDateAddChanged) {
					const t_index = todos.findIndex((item) => item._id === todoClone?._id);
					const index = todoClone.tasks.length - 1;
					todos[t_index].tasks[index] = todoClone.tasks[index];
				}

				if (editMode) {
					taskSaveData = { ...taskSaveDataDefault };
					editMode = false;
					editId = 0;
					isTaskDateEditChanged = false;
					taskDateChangeDestTodo = null;
					taskChangeEditDate = null;
				}
				if (addMode) {
					taskSaveData = { ...taskSaveDataDefault };
					taskChangeAddDate = null;
					isTaskDateAddChanged = false;
					addMode = false;
				}
				if (inlineLastEditId) {
					editIds = _.without(editIds, inlineLastEditId);
				}
				triggerSync = false;
			}
		} catch (err) {
			console.log(err);
			alert('failed persist storage syncing');
		}
	};

	$: triggerSync && persistState();

	const scheduleNotification = async (isAdd: boolean = true, task: Task) => {
		const notificationService = NotificationService.getInstance();
		if (
			taskSaveData.remSchedule &&
			(isAdd ||
				(task &&
					('undefined' == task.remSchedule || task.remSchedule !== taskSaveData.remSchedule)))
		) {
			
			notificationService.checkOrRequestPermission();

			if (taskSaveData.remScheduleId && task && todoClone) {
				notificationService.scheduleNotification([
					{
						id: taskSaveData.remScheduleId,
						title: taskSaveData.desc.substring(0, 15),
						body: taskSaveData.desc.substring(0, 150),
						schedule: {
							at: new Date(taskSaveData.remSchedule),
							allowWhileIdle: true,
							repeats: taskSaveData.remScheduleRepeats,
							// every: 'minute'
						},
						autoCancel: true,
						extra: { type: 'reminder', todoId: todoClone._id, taskId: task.id },
						channelId: 'notespro-reminder',
						actionTypeId: 'reminder'
					}
				]);

				notificationService.addListeners<ActionPerformed>(
					ListenerEvents.localNotificationActionPerformed,
					async (notificationAction) => {
						if (
							notificationAction.actionId === 'view' &&
							notificationAction.notification.extra.type === 'reminder'
						) {
							goto(
								`/task?todoid=${notificationAction.notification.extra.todoId}&taskid=${notificationAction.notification.extra.taskId}`
							);
						}
					}
				);
			}

			return;
		}
	};

	const cancelNotification = async (taskData: TaskSaveData) => {
		const notificationService = NotificationService.getInstance();
		if (taskData.remScheduleId) {
			await notificationService.cancel([
				{
					id: taskData.remScheduleId
				}
			])
			await tick()
			taskSaveData = Object.assign({ ...taskSaveData, ...taskRemScheduleDefaults });
		}
	}

	const addTask = async () => {
		if (!taskSaveData.desc) {
			addMode = false;
			taskChangeAddDate = null;
			isTaskDateAddChanged = false;
			return;
		}
		if (!isTaskDateAddChanged) {
			todoClone = todo;
		} else {
			if (taskChangeAddDate) {
				//@ts-ignore
				let destTodo = todos.find((item) => item._id === formatDateOnly(taskChangeAddDate));
				if (!destTodo) {
					const { docs: addDateTodo } = await db.find({
						selector: { _id: { $eq: formatDateOnly(taskChangeAddDate) } },
						limit: 1
					});
					await tick();
					if (addDateTodo.length) {
						//@ts-ignore
						destTodo = addDateTodo[0];
					} else {
						try {
							const result = await createTodo(false, taskChangeAddDate);
							await tick();
							if (result.length) {
								destTodo = result[0];
							}
						} catch (err) {
							console.log(err);
						}
					}

					if (destTodo) {
						todos = _.orderBy([...todos, destTodo], ['_id']);
						todoClone = destTodo;
					}
				} else {
					todoClone = destTodo;
					todos = todos;
				}
			}
		}
		if (todoClone) {
			const tasks = todoClone.tasks;
			let lastId =
				tasks.length && tasks.length > 1
					? tasks[tasks.length - 1].id
					: tasks.length
					? tasks[0].id
					: 0;

			if (taskSaveData.remSchedule) {
				const schedule = combineDateAndTime(todoClone._id, taskSaveData.remSchedule);
				taskSaveData.remSchedule = schedule;
			}
			const saveTask = { id: lastId + 1, isDone: false, ...taskSaveData };
			todoClone.tasks = [...tasks, saveTask];
			await scheduleNotification(true, saveTask);
			await tick();
			triggerSync = true;
			taskSaveData = { ...taskSaveDataDefault };
		}
	};

	const updateTask = async (taskid: number = 0, desc: string = '') => {
		if (!isTaskDateEditChanged) {
			todoClone = todo;
		} else {
			try {
				if (taskChangeEditDate) {
					const status = await changeDate(taskChangeEditDate);
					await tick();
					if (status && taskDateChangeDestTodo) {
						todoClone = taskDateChangeDestTodo;
					}
				}
			} catch (err) {
				console.log(err);
			}
		}
		if (todoClone) {
			//inline updation - @deprecated - won't be maintained
			if (taskid) {
				const index = todoClone.tasks.findIndex((task) => task.id === taskid);
				todoClone.tasks[index].desc = desc;
			} else {
				const index = todoClone.tasks.findIndex((task) => task.id === editId);
				if (taskSaveData.remSchedule) {
					const schedule = combineDateAndTime(todoClone._id, taskSaveData.remSchedule);
					taskSaveData.remSchedule = schedule;
				}

				await scheduleNotification(false, todoClone.tasks[index]);
				await tick();
				todoClone.tasks[index] = Object.assign(todoClone.tasks[index], taskSaveData);
			}
			triggerSync = true;
			taskSaveData = { ...taskSaveDataDefault };
		}
	};

	const removeTask = () => {
		todoClone = todo;
		const index = todo.tasks.findIndex((task) => task.id === editId);
		todoClone.tasks.splice(index, 1);
		triggerSync = true;
	};

	const toggleCompleted = (e: CustomEvent): void => {
		//@ts-ignore
		const taskid = parseInt(e.target.value);
		const index = todo.tasks.findIndex((task) => task.id === taskid);
		if (todoClone) {
			todoClone.tasks[index].isDone = !todo.tasks[index].isDone;
			triggerSync = true;
		}
	};

	/* const toggleTaskMenu = (e: MouseEvent) => {
		//@ts-ignore
		const target = e.target.getAttribute('data-target');
		//@ts-ignore
		const targetEl = document.getElementById(target);
		//@ts-ignore
		targetEl.classList.toggle('hidden');
		//@ts-ignore
		targetEl.classList.toggle('flex');
	}; */

	let openPopup = false;
	let openConfirmPopup = false;
	let confirmPopupTitle = '';
	let confirmPopupContent = '';
	let confirmPopupCallback = () => {};
	let confirmPopupButtonNo = 'No';
	let confirmPopupButtonYes = 'Yes'
	const confirmPopup = (title: string, content: string, cb: () => any, buttonNo?: string, buttonYes?: string) => {
		confirmPopupTitle = title;
		confirmPopupContent = content;
		confirmPopupCallback = cb;
		if (buttonNo) {
			confirmPopupButtonNo = buttonNo;
		}
		if (buttonYes) {
			confirmPopupButtonYes = buttonYes;
		}
		openConfirmPopup = true;
	};

	const persistStateMulti = async (values: TODO[]) => {
		try {
			const result = await db.bulkDocs(values);
			await tick();
			const updatedValues = _.map(values, (value) => {
				const resultItem = _.find(result, { id: value._id });
				if (resultItem) {
					return _.merge({}, value, { _rev: resultItem.rev });
				}
				return value;
			});
			return updatedValues;
		} catch (err) {
			console.log(err);
			throw error(500, 'failed to update');
		}
	};

	const changeDate = async (dateInput: Date) => {
		const isSameDate = todo._id === formatDateOnly(dateInput);

		if (!isSameDate) {
			try {
				let status = false;
				const { docs: moveDateTodo } = await db.find({
					selector: { _id: { $eq: formatDateOnly(dateInput) } },
					limit: 1
				});
				await tick();
				const taskToMove = todo.tasks.find((task) => task.id === editId);
				if (moveDateTodo.length) {
					const destTodo = todos.find((item) => item._id === formatDateOnly(dateInput));

					if (taskToMove && destTodo) {
						status = await switchTask(taskToMove, todo, destTodo);
					} else if (taskToMove && !destTodo) {
						//@ts-ignore
						status = await switchTask(taskToMove, todo, moveDateTodo[0], false);
					}
				} else {
					const destTodo = await createTodo(false, dateInput);
					await tick();
					if (taskToMove) {
						status = await switchTask(taskToMove, todo, destTodo[0], false, true);
					}
				}

				await tick();

				return status;
			} catch (err) {
				throw error(500, 'Something went wrong, date could nnot save');
			}

			//non persistance switching
			async function switchTask(
				task: Task,
				source: TODO,
				dest: TODO,
				isDestInTodos = true,
				isNewDest = false
			) {
				let sourceClone = source;
				let destClone = dest;

				// Find the index of the task in the source tasks array
				const indexToRemove = sourceClone.tasks.findIndex((t) => t.id === task.id);

				if (indexToRemove !== -1) {
					// Remove the task from the source tasks array
					const removedTask = sourceClone.tasks.splice(indexToRemove, 1)[0];
					if (destClone.tasks) {
						// Check if the id already exists in the destination tasks array
						const existingDestTask = destClone.tasks.find((t) => t.id === removedTask.id);

						if (existingDestTask) {
							// If the id already exists, increment its value
							removedTask.id = Math.max(...destClone.tasks.map((t) => t.id)) + 1;
						}
					} else {
						removedTask.id = 0;
					}

					// Add the task to the destination tasks array
					destClone.tasks.push(removedTask);

					try {
						let valuesWithUpdatedRev = null;
						// create todo
						if (isNewDest) {
							const valuesClone = [sourceClone];
							valuesWithUpdatedRev = await persistStateMulti(valuesClone);
						} else {
							const valuesClone = [sourceClone, destClone];
							valuesWithUpdatedRev = await persistStateMulti(valuesClone);
						}
						await tick();

						if (valuesWithUpdatedRev) {
							_.each(valuesWithUpdatedRev, (value) => {
								if (value._id === sourceClone._id) {
									sourceClone._rev = value._rev;
								}
								if (value._id === destClone._id) {
									destClone._rev = value._rev;
								}
							});

							source = sourceClone;
							dest = destClone;
							// pushing to todos array if not exist
							if (!isDestInTodos) {
								todos = _.orderBy([...todos, dest], ['_id']);
							} else {
								// reassign to reflect in state
								todos = todos;
							}

							isTaskDateEditChanged = true;
							taskDateChangeDestTodo = dest;
							editId = removedTask.id;

							return true;
						} else {
							return false;
						}
					} catch (err) {
						throw error(500, 'Something went wrong, date could not save');
					}
				} else {
					throw error(500, 'Something went wrong, date could not save');
				}
			}
		} else {
			return false;
		}
	};
</script>

<Panel bind:open={isOpen} class="!rounded-sm">
	<Header>
		<div class="flex items-center">
			<div class="w-11/12">
				{formatDateReadable(todo.dateIso)}
			</div>
			<div class="w-1/12 flex justify-end">
				<IconButton
					class="material-icons !px-0 flex justify-end"
					on:click={() => {
						confirmPopup(
							'Remove Date',
							'All contents inside date will be lost, are you sure you want to delete date?',
							() => removeTodo(todo._id)
						);
					}}
				>
					delete
				</IconButton>
			</div>
		</div>
	</Header>
	<AccordionContent class="!px-0">
		<div class="dt-todo-task-container">
			{#each todo.tasks as task, i (task.id)}
				<ContextMenu.Root>
					<List class={`mb-2 task-list ${task.isDone && 'task-done'}`}>
						<ContextMenu.Trigger>
							<Item class="flex items-center">
								<Graphic>
									<Checkbox
										on:click={(e) => toggleCompleted(e)}
										value={task.id}
										bind:checked={task.isDone}
									/>
								</Graphic>
								<Text
									on:click={() => {
										viewMode = true;
										addMode = false;
										editMode = false;
										taskSaveData = { ...task };
										openPopup = true;
									}}
									class="w-full">{task.desc}</Text
								>
								<Meta>
									<Menu placement="end" gutter={5} size="xs" class="bg-transparent p-0 border-none">
										<IconButton slot="control" class="material-icons pr-0 text-right"
											>more_vert</IconButton
										>

										<Menu.Item class="p-0">
											<MaterialMenu static>
												<List>
													<Item
														on:SMUI:action={() => {
															viewMode = false;
															addMode = false;
															if (!editMode || editId !== task.id) {
																editMode = true;
																editId = task.id;
																taskSaveData = { ...task };
															}
															openPopup = true;
														}}
													>
														<Text>Edit</Text>
													</Item>
													<Item
														on:SMUI:action={() => {
															editId = task.id;
															confirmPopup(
																'Remove Note',
																'Are you sure you want to delete?',
																removeTask
															);
														}}
													>
														<Text>Delete</Text>
													</Item>
												</List>
											</MaterialMenu>
										</Menu.Item>
									</Menu>
								</Meta>
							</Item>
						</ContextMenu.Trigger>
						<ContextMenu.Content>
							<ContextMenu.Item
								on:click={() => {
									viewMode = false;
									addMode = false;
									if (!editMode || editId !== task.id) {
										editMode = true;
										editId = task.id;
										taskSaveData = { ...task };
									}
									openPopup = true;
								}}>Edit</ContextMenu.Item
							>
							<ContextMenu.Item
								on:click={() => {
									editId = task.id;
									confirmPopup('Remove Note', 'Are you sure you want to delete?', removeTask);
								}}>Delete</ContextMenu.Item
							>
						</ContextMenu.Content>
					</List>
				</ContextMenu.Root>
			{/each}
		</div>
		<div class="flex justify-end px-7">
			<MaterialButton
				color="primary"
				variant="unelevated"
				on:click={() => {
					taskSaveData = { ...taskSaveDataDefault };
					addMode = true;
					editId = 0;
					editMode = false;
					viewMode = false;
					openPopup = true;
				}}
			>
				<Icon class="material-icons">add</Icon> Add Note
			</MaterialButton>
		</div>

		<Dialog
			bind:open={openPopup}
			aria-labelledby={`todo-${todo._id}-popup-title`}
			aria-describedby={`todo-${todo._id}-popup-content`}
			surface$style="width: 100%; height: 100%; min-width: 100vw"
			class="z-50"
		>
			<div class="flex justify-end">
				<Actions>
					<IconButton class="material-icons" on:click={() => (openPopup = false)}>close</IconButton>
				</Actions>
			</div>
			<div class="flex flex-col items-center px-3">
				<div class="flex w-full">
					<Title id={`todo-${todo._id}-popup-title`} class="!px-0">
						{#if isTaskDateEditChanged && taskChangeEditDate}
							{formatDateReadable(taskChangeEditDate.toISOString())}
						{:else if isTaskDateAddChanged && taskChangeAddDate}
							{formatDateReadable(taskChangeAddDate.toISOString())}
						{:else}
							{formatDateReadable(todo.dateIso)}
						{/if}
						{#if !viewMode && ((editId && editMode) || addMode)}
							<MaterialButton
								on:click={() => {
									if (!isTaskDateEditCalnderOpen) {
										new AirDatepicker(`#todo-${todo._id}-popup-calendar`, {
											locale: AirDatelocaleEn,
											buttons: [
												{
													content() {
														return 'Close';
													},
													tagName: 'button',
													className: '!bg-slate-700 !text-white !mr-2',
													onClick(dp) {
														dp.destroy();
														isTaskDateAddChanged = false;
														isTaskDateEditChanged = false;
														isTaskDateEditCalnderOpen = false;
														taskChangeEditDate = null;
														taskChangeAddDate = null;
													}
												},
												{
													content(dp) {
														return 'Update';
													},
													tagName: 'button',
													className: '!bg-blue-700 !text-white',
													onClick(dp) {
														//@ts-ignore
														const dpDate = dp.lastSelectedDate ?? new Date(todo.dateIso);

														if (editId && editMode) {
															isTaskDateEditChanged = true;
															taskChangeEditDate = formatDateRegular(dpDate);
														} else {
															isTaskDateAddChanged = true;
															taskChangeAddDate = formatDateRegular(dpDate);
														}
														// changeDate(DateInputValue);
														dp.destroy();
														isTaskDateEditCalnderOpen = false;
													}
												}
											]
										});
										isTaskDateEditCalnderOpen = true;
									}
								}}
							>
								<Icon class="material-icons">edit</Icon>
							</MaterialButton>
						{/if}
					</Title>
				</div>
				<div class="flex pl-3 mb-3 popup-calendar" class:!hidden={!isTaskDateEditCalnderOpen}>
					<div id={`todo-${todo._id}-popup-calendar`} class="w-12/12" />
				</div>
				<div class="flex w-full justify-end">
					{#if addMode || (editId && editMode)}
						<MaterialButton
							class="!px-0"
							on:click={() => (isTaskReminderTimerOpen = !isTaskReminderTimerOpen)}
						>
							<Icon class="material-icons">notifications</Icon>{`${
								taskSaveData.remSchedule ? 'Update' : 'Set'
							} Reminder`}
						</MaterialButton>
					{/if}
				</div>
			</div>
			<div class="flex justify-end px-3 items-end flex-col">
				{#if taskSaveData.remSchedule && isGreaterThanOrEqToday(taskSaveData.remSchedule)}
					<span class="flex items-center">
						<Icon class="material-icons">notifications</Icon> Scheduled at: &nbsp
						<b>
							{#if isTaskDateEditChanged && taskChangeEditDate}
								{convertToReadableDateTime(
									combineDateAndTime(formatDateOnly(taskChangeEditDate), taskSaveData.remSchedule)
								)}
							{:else if isTaskDateAddChanged && taskChangeAddDate}
								{convertToReadableDateTime(
									combineDateAndTime(formatDateOnly(taskChangeAddDate), taskSaveData.remSchedule)
								)}
							{:else}
								{convertToReadableDateTime(combineDateAndTime(todo._id, taskSaveData.remSchedule))}
							{/if}
						</b></span
					>
					<div class="flex items-center">
						<Switch class="mr-3" label="Repeats" bind:checked={taskSaveData.remScheduleRepeats} size='sm' onLabel="ON" offLabel="OFF" />
						<NativeSelect
							data={scheduleEvery}
							bind:value={taskSaveData.remScheduleEvery}
							label="Repeat interval"
							placeholder="Select interval"
						/>
					</div>
					<div class="flex justify-center columns margins">
						<MaterialButton on:click={() => {
							confirmPopup(
								'Cancel Reminder',
								'You no longer receive reminder if you press cancel?',
								() => cancelNotification(taskSaveData),
								'No',
								'Cancel'
							);
						}}>Cancel Reminder</MaterialButton>
					</div>
				{:else}
					<span>No Reminder Set</span>
				{/if}
			</div>
			{#if isTaskReminderTimerOpen}
				<div class="popup-timer" transition:fade={{ duration: 300 }}>
					<TimePickerModal
						date={_selectedTimer}
						options={timerOptions}
						on:cancel={(e) => {
							isTaskReminderTimerOpen = false;
						}}
						on:ok={(e) => {
							taskSaveData.remScheduleId = getRandomNumberString(7);
							taskSaveData.remSchedule = e.detail;
							taskSaveData.isRemNotified = false;
							isTaskReminderTimerOpen = false;
						}}
						on:close={(e) => (isTaskReminderTimerOpen = false)}
					/>
				</div>
			{/if}

			<div>
				<DialogContent id={`todo-${todo._id}-popup-content`} class="!px-3">
					{#if !viewMode}
						<div class="flex items-center justify-between mb-3">
							<MaterialButton
								class=" flex items-center !text-red-600 px-0"
								on:click={() => (taskSaveData.desc = '')}
							>
								<Icon class="material-icons">delete</Icon>
								Clear
							</MaterialButton>
							<Actions class="px-0">
								<MaterialButton
									variant="raised"
									action="accept"
									on:click={() => (editMode ? updateTask() : addTask())}
								>
									<Label><Icon class="material-icons">save</Icon> Save</Label>
								</MaterialButton>
							</Actions>
						</div>
					{/if}
					<Textfield
						style="width: 100%;height: 40vh"
						helperLine$style="width: 100%;"
						textarea
						bind:value={taskSaveData.desc}
						label="Description"
					/>
				</DialogContent>
			</div>
		</Dialog>
		<Dialog
			bind:open={openConfirmPopup}
			aria-labelledby="confirm-popup-title"
			aria-describedby="confirm-popup-content"
			class="mdc-dialog-position-bottom"
			style="z-index: 9999"
		>
			<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
			<Title id="confirm-popup-title">{confirmPopupTitle}</Title>
			<DialogContent id="confirm-popup-content">{confirmPopupContent}</DialogContent>
			<Actions>
				<MaterialButton on:click={() => (openConfirmPopup = false)}>
					<Label>{confirmPopupButtonNo}</Label>
				</MaterialButton>
				<MaterialButton class="!bg-red-700 !text-white" on:click={() => confirmPopupCallback()}>
					<Label>{confirmPopupButtonYes}</Label>
				</MaterialButton>
			</Actions>
		</Dialog>
	</AccordionContent>
</Panel>
