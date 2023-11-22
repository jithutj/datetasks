<script lang="ts">
	import { Database } from '$lib';
	import type { TODO, Task } from '$lib/types';
	import _, { add } from 'lodash';
	import { formatDateOnly, formatDateReadable, formatDateRegular } from '$lib/utils/date';
	import { Menu } from '@svelteuidev/core';
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

	type TaskSaveData = Partial<Omit<Task, 'desc'>> & { desc: Task['desc'] }
	const taskSaveDataDefault = {desc: '', remScheduleId: 0, remSchedule: null, isRemNotified: false}
	let taskSaveData: TaskSaveData = taskSaveDataDefault;
	
	let isTaskDateEditChanged = false;
	let taskDateChangeDestTodo: TODO | null = null;
	let taskChangeEditDate: Date | null = null;
	let taskChangeAddDate: Date | null = null;
	let isTaskDateAddChanged = false;
	let isTaskDateEditCalnderOpen = false;
	let remSchedule: Task['remSchedule'] = null;
	let isRemNotified: Task['isRemNotified'] = false;

	let isTaskReminderTimerOpen = false;
	const persistState = async () => {
		try {
			if (todoClone) {
				const { rev } = await db.put(todoClone);
				todoClone._rev = rev;
				if (!isTaskDateEditChanged && !isTaskDateAddChanged) {
					todo = todoClone;
				} else if (isTaskDateEditChanged) {
					const t_index = todos.findIndex((item) => item._id === todoClone?._id);
					const tk_index = todos[t_index].tasks.findIndex((task) => task.id === editId);
					const index = todoClone.tasks.findIndex((task) => task.id === editId);
					todos[t_index].tasks[tk_index].desc = todoClone.tasks[index].desc;
				}

				if (editMode) {
					taskSaveData = taskSaveDataDefault;
					editMode = false;
					editId = 0;
					isTaskDateEditChanged = false;
					todoClone = null;
					taskDateChangeDestTodo = null;
					taskChangeEditDate = null;
				}
				if (addMode) {
					taskSaveData = taskSaveDataDefault;
					todoClone = null;
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

	const scheduleNotification = async (isAdd : boolean = true, task?: Task) => {
		console.log(taskSaveData.remSchedule);
		if (taskSaveData.remSchedule && (isAdd || (task && task.remSchedule !== taskSaveData.remSchedule))) {
			console.log('trigger notification');

			/* taskSaveData.remSchedule = null;
			taskSaveData.isRemNotified = false; */
			return true;
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

			await scheduleNotification();
			await tick();
			todoClone.tasks = [...tasks, { id: lastId + 1, isDone: false, ...taskSaveData  }];
			triggerSync = true;
			taskSaveData = taskSaveDataDefault;
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
				await scheduleNotification(false, todoClone.tasks[index]);
				await tick();
				todoClone.tasks[index] = Object.assign(todoClone.tasks[index], taskSaveData)
			}
			triggerSync = true;
			taskSaveData = taskSaveDataDefault;
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
	const confirmPopup = (title: string, content: string, cb: () => any) => {
		confirmPopupTitle = title;
		confirmPopupContent = content;
		confirmPopupCallback = cb;
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
		<div class="flex items-center px-5">
			<div class="w-11/12">
				{formatDateReadable(todo.dateIso)}
			</div>
			<div class="w-1/12 flex justify-end">
				<IconButton
					class="material-icons"
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
										taskSaveData = task;
										openPopup = true;
										console.log(taskSaveData)
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
																taskSaveData = task;
																remSchedule = task.remSchedule;
																isRemNotified = task.isRemNotified;
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
										taskSaveData = task;
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
					taskSaveData = taskSaveDataDefault;
					addMode = true;
					editId = 0;
					editMode = false;
					viewMode = false;
					openPopup = true;
					remSchedule = null;
					isRemNotified = false;
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
			<div class="flex items-center justify-between px-3">
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
												content(dp) {
													return 'Update Date';
												},
												className: 'btn btn-accent',
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
				{#if (addMode || (editId && editMode)) && (!remSchedule || isRemNotified)}
					<MaterialButton
						class="!px-o"
						on:click={() => {
							if (!isTaskReminderTimerOpen) {
								new AirDatepicker(`#todo-${todo._id}-popup-timer`, {
									locale: AirDatelocaleEn,
									timepicker: true,
									onlyTimepicker: true,
									buttons: [
										{
											content(dp) {
												return 'Set Reminder Time';
											},
											className: 'btn btn-accent',
											onClick(dp) {
												// console.log(dp);
												//@ts-ignore
												const dpDate = dp.lastSelectedDate ?? new Date(todo.dateIso);
												taskSaveData.remSchedule = dpDate;
												taskSaveData.isRemNotified = false;
												
												dp.destroy();
												isTaskReminderTimerOpen = false;
											}
										}
									]
								});
								isTaskReminderTimerOpen = true;
							}
						}}
					>
						<Icon class="material-icons">notifications</Icon>Set Reminder
					</MaterialButton>
				{/if}
			</div>
			<div class="flex pl-3 mb-3">
				<div id={`todo-${todo._id}-popup-calendar`} class="w-12/12" />
			</div>
			<div class="flex justify-end pr-3 mb-3">
				<div id={`todo-${todo._id}-popup-timer`} class="w-12/12" />
			</div>
			<div class="flex justify-end px-2">
				{#if !viewMode}
					<Actions>
						<MaterialButton
							variant="raised"
							action="accept"
							on:click={() => (editMode ? updateTask() : addTask())}
						>
							<Label><Icon class="material-icons">save</Icon> Save</Label>
						</MaterialButton>
					</Actions>
				{/if}
			</div>

			<div>
				<DialogContent id={`todo-${todo._id}-popup-content`}>
					<Textfield
						style="width: 100%;height: 70vh"
						helperLine$style="width: 100%;"
						textarea
						bind:value={taskSaveData.desc}
						label="Description"
						class={viewMode ? 'pointer-events-none' : ''}
					/>
				</DialogContent>
			</div>
		</Dialog>
		<Dialog
			bind:open={openConfirmPopup}
			aria-labelledby="confirm-popup-title"
			aria-describedby="confirm-popup-content"
		>
			<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
			<Title id="confirm-popup-title">{confirmPopupTitle}</Title>
			<DialogContent id="confirm-popup-content">{confirmPopupContent}</DialogContent>
			<Actions>
				<MaterialButton on:click={() => (openConfirmPopup = false)}>
					<Label>No</Label>
				</MaterialButton>
				<MaterialButton on:click={() => confirmPopupCallback()}>
					<Label>Yes</Label>
				</MaterialButton>
			</Actions>
		</Dialog>
	</AccordionContent>
</Panel>
