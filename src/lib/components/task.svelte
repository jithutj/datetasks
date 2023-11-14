<script lang="ts">
	import { Database } from '$lib';
	import type { TODO } from '$lib/types';
	import _ from 'lodash';
	import { formatDateReadable } from '$lib/utils/date';
	import { ActionIcon, Button, Menu } from '@svelteuidev/core';
	//@ts-ignore
	import { Trash, Pencil1, DotsVertical, Check } from 'radix-icons-svelte';

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
				const taskEl = document.querySelector(`[data-task="${todo._id}-${editId}"]`);
				todoDesc = '';
				editMode = false;
				editId = 0;
				//@ts-ignore
				taskEl.classList.add('blinking-border');
				setTimeout(() => {
					//@ts-ignore
					taskEl.classList.remove('blinking-border');
				}, 3000)
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
		scrollToBottom();
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

	const toggleCompleted = (e: MouseEvent): void => {
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

	
</script>

<div class="collapse collapse-plus bg-base-200 my-3">
	{#if isOpen}
		<input type="radio" name="todo-accordion" checked />
	{:else}
		<input type="radio" name="todo-accordion" />
	{/if}

	<div class="collapse-title text-xl font-medium flex items-center">
		<div class="w-10/12">
		{formatDateReadable(todo.dateIso)}
		</div>
		<div class="w-2/12 z-40">
			<Button stot="control" class="btn btn-circle" color="black" ripple on:click={() => { removeTodo(todo._id)}} override={{
				border: 'none',
				background: 'transparent',
				'&:hover': {
					background: 'transparent'
				}
			}}>
				<Trash />
			</Button>
		</div>
	</div>
	<div class="collapse-content">
		<ul>
			{#each todo.tasks as task, i (task.id)}
				<li data-task={`${todo._id}-${task.id}`} class="border rounded-lg border-gray-500 p-2 my-5 {task.isDone ? 'done' : 'not-done'}">
					<div class="flex items-start">
						<label class="cursor-pointer label flex items-center w-1/12">
							<div class="flex items-center">
								<input
									type="checkbox"
									on:click={(e) => toggleCompleted(e)}
									value={task.id}
									class="checkbox checkbox-accent"
									bind:checked={task.isDone}
								/>	
							</div>
						</label>
						<textarea bind:this={textElem[task.id]} disabled={!editIds.includes(task.id)} class="label-text border-none disable:bg-transparent p-2 w-8/12 h-auto disabled:resize-none">{task.desc}</textarea>
						<Button slot="control" ripple variant="default" override={{
							border: 'none',
							background: 'transparent',
							'&:hover': {
								background: 'transparent'
							}
						}} on:click={() => {
							// enable edit
							if (!editIds.includes(task.id)) {
								editIds = [...editIds, task.id];
							} else { //submit edit
								const desc = textElem[task.id].value;
								inlineLastEditId = task.id;
								updateTask(task.id, desc);
							}
						}}>
							{#if editIds.includes(task.id)}
						    <ActionIcon size="18" radius="xl" variant="outline">
								<Check size={18}  />
							</ActionIcon>
							{:else}
								<Pencil1 size={16} />
							{/if}
						</Button>
						<Menu
							placement="end"
							gutter={5}
							size="xs"
						>
							<Button slot="control" ripple variant="default" override={{
								border: 'none',
								background: 'transparent',
								'&:hover': {
									background: 'transparent'
								}
							}}>
								<DotsVertical />
							</Button>
							<Menu.Item icon={Pencil1} on:click={() => {
								editMode = true;
								editId = task.id;
								todoDesc = task.desc;
							}}>Edit</Menu.Item>
							<Menu.Item color="red" icon={Trash} on:click={() => {
								editId = task.id
								removeTask();
							}}>Delete</Menu.Item>
						</Menu>
					</div>
				</li>
			{/each}
		</ul>
		<div class="dt-todo-input-container mt-3" class:popup={editMode}>
			{#if editMode}
				<button class="btn bg-transparent border-none justify-end hover:bg-transparent" on:click={() => { editMode = false; editId = 0; todoDesc = ''  } }>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
				  </button>
			{/if}
			<textarea class="textarea textarea-bordered" bind:value={todoDesc} />
			<button class="btn btn-primary" on:click={() => editMode ? updateTask() : addTask ()}>
				{ editMode ? 'Update' : 'Add' }
			</button>  
		</div>
	</div>
</div>
