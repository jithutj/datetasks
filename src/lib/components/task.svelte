<script lang="ts">
	import { Database } from '$lib';
	import type { TODO } from '$lib/types';
	import _ from 'lodash';
	import { formatDateReadable } from '$lib/utils/date';
	import { ActionIcon, Button, Menu } from '@svelteuidev/core';
	//@ts-ignore
	import { Trash, Pencil1, DotsVertical, Check } from 'radix-icons-svelte';
	//@ts-ignore
	import Accordion, { Panel, Header, Content } from '@smui-extra/accordion';

	import Paper, { Subtitle } from '@smui/paper';
	import IconButton, { Icon } from '@smui/icon-button';
	import { default as MaterialMenu } from '@smui/menu';
  	import List, { Item, Separator, Text } from '@smui/list';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import { Label, default as MateriaButton } from '@smui/button';
	import Checkbox from '@smui/checkbox';
	import Dialog, { Title, Content as DialogContent, Actions } from '@smui/dialog';

	export let todo: TODO;
	export let isOpen: boolean;
	export let containerId: string;
	export let removeTodo: (todoId: TODO['_id']) => void 

	const db = Database.getInstance().getDB();

	let editMode: boolean = false;
	let editId: number = 0;
	let editIds: number[] = []; // inline edit ids
	let inlineLastEditId: number  = 0;
	let textElem: { [key: number]: HTMLTextAreaElement } = {};
	let todoClone: TODO = todo;
	let triggerSync = false;
	let todoDesc = '';

	function scrollToBottom() {
		const container = document.getElementById(containerId);
		//@ts-ignore
		container.scrollTop = container.scrollHeight;
  	}

	const persistState = async () => {
		try {
			const { rev } = await db.put(todoClone);
			todoClone._rev = rev;
			todo = todoClone;
			triggerSync = false;
			if (editMode) {
				todoDesc = '';
				editMode = false;
				editId = 0;
			}
			if (inlineLastEditId) {
				editIds = _.without(editIds, inlineLastEditId);
			}
		} catch (err) {
			console.log(err);
			alert('failed persist storage syncing')
		}	
	}

	$: triggerSync && persistState()

	const addTask = () => {
		if (!todoDesc) return
		todoClone = todo;
        const tasks = todoClone.tasks;
        let lastId = tasks.length && tasks.length > 1 ? tasks[tasks.length - 1].id
            : (tasks.length ? tasks[0].id : 0);

		todoClone.tasks = [...tasks, { id: lastId + 1, desc: todoDesc, isDone: false }]
        todoDesc = ''
		triggerSync = true;
	};

	const updateTask = (taskid: number = 0, desc: string = '') => {
		todoClone = todo;
		//inline updation
		if (taskid) {
			const index = todoClone.tasks.findIndex(task => task.id === taskid)
			todoClone.tasks[index].desc = desc;
		} else {
			const index = todoClone.tasks.findIndex(task => task.id === editId)
			todoClone.tasks[index].desc = todoDesc;
		}
		triggerSync = true;
	}

	const removeTask = () => {
		todoClone = todo;
		const index = todo.tasks.findIndex(task => task.id === editId)
		todoClone.tasks.splice(index, 1);
		triggerSync = true;
	}

	const toggleCompleted = (e: CustomEvent): void => {
		//@ts-ignore
		const taskid = parseInt(e.target.value);
        const index = todo.tasks.findIndex(task => task.id === taskid)
        todoClone.tasks[index].isDone = !todo.tasks[index].isDone;
		triggerSync = true;
	};

	const toggleTaskMenu = (e: MouseEvent) => {
		//@ts-ignore
		const target = e.target.getAttribute('data-target');
		//@ts-ignore
		const targetEl = document.getElementById(target);
		//@ts-ignore
		targetEl.classList.toggle('hidden');
		//@ts-ignore
		targetEl.classList.toggle('flex');
	}

	let openPopup = false;
</script>
	  <Panel bind:open={ isOpen }>
		<Header>
			<div class="flex items-center">
				<div class="w-11/12">
					{formatDateReadable(todo.dateIso)}
				</div>
				<div class="w-1/12">
				<IconButton class="material-icons" on:click={() => { removeTodo(todo._id)}}>
						delete
					</IconButton>
				</div> 
			</div>
		</Header>
		<Content>
			<div class="paper-container dt-todo-task-container">
			{#each todo.tasks as task, i (task.id)}
			
				<Paper class={`mb-4 ml-0 mr-0 ${task.isDone && 'task-done'}`}>
					<Subtitle class="flex items-center">
						<div class="w-2/12">
								<Checkbox
									on:click={(e) => toggleCompleted(e)}
									value={task.id}
									bind:checked={task.isDone}
								/>
						</div>
						<div class="w-9/12">
							{task.desc}
						</div>
						<div class="w-1/12">
						<Menu
							placement="end"
							gutter={5}
							size="xs"
							class="bg-transparent p-0 border-none"
						>
							<IconButton slot="control" class="material-icons"
								>more_vert</IconButton
							  >
							<Menu.Item class="p-0">
								<MaterialMenu static>
									<List>
										<Item on:SMUI:action={() => {
											if (!editMode || editId !== task.id) {
												editMode = true;
												editId = task.id;
												todoDesc = task.desc;
											}
											openPopup = true;
										}}>
										<Text>Edit</Text>
										</Item>
										<Item on:SMUI:action={() => {
											editId = task.id
											removeTask();
										}}>
										<Text>Delete</Text>
										</Item>
									</List>
								</MaterialMenu>
							</Menu.Item>
						</Menu>
						</div>
					</Subtitle>
				</Paper>
				
			{/each}
		</div>
		<div class="flex justify-end">
			<MateriaButton color="primary" variant="unelevated" on:click={() => { 
				editId = 0;
				editMode = false;
				todoDesc = '';
				openPopup = true 
			} }>
				Add
			</MateriaButton> 
		</div>
		 
		<Dialog
			bind:open={openPopup}
			aria-labelledby={`todo-${todo._id}-popup-title`}
			aria-describedby={`todo-${todo._id}-popup-content`}
			surface$style="width: 100%; height: 100%; min-width: 100vw">
			<div class="flex justify-end">
			<Actions>
				<IconButton class="material-icons" on:click={() => openPopup = false }
					>close</IconButton>
			</Actions>
			</div>
			<div class="flex items-center justify-between">
			<Title id={`todo-${todo._id}-popup-title`}>
				{formatDateReadable(todo.dateIso)}
			</Title>
			<Actions>
				<MateriaButton variant="raised" action="accept" on:click={() => editMode ? updateTask() : addTask ()}>
					<Label>Save</Label>
				</MateriaButton>
			</Actions>
			</div>
			<div>
			<DialogContent id={`todo-${todo._id}-popup-content`}>
				<Textfield
					style="width: 100%;height: 70vh"
					helperLine$style="width: 100%;"
					textarea
					bind:value={todoDesc}
					label="Description"
				>
				</Textfield>
			</DialogContent>
			</div>
			</Dialog>
		</Content>
	  </Panel>