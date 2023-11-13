<script lang="ts">
	import { Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateReadable } from '$lib/utils/date';
	import { afterUpdate } from 'svelte';

	export let todo: TODO;
	export let isOpen: boolean;
	export let containerId: string;

	const db = Database.getInstance().getDB();

	let editMode: boolean = false;
	let editId: number = 0;
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
				console.log(taskEl);
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
		} catch (err) {
			console.log(err);
			alert('failed persist storage syncing')
		}	
	}

	$: triggerSync && persistState()

	const addTodo = () => {
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

	const updateTodo = () => {
		todoClone = todo;
		const index = todoClone.tasks.findIndex(task => task.id === editId)
		todoClone.tasks[index].desc = todoDesc;
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

	<div class="collapse-title text-xl font-medium">
		{formatDateReadable(todo.dateIso)}
	</div>
	<div class="collapse-content">
		<ul>
			{#each todo.tasks as task, i (task.id)}
				<li data-task={`${todo._id}-${task.id}`} class="border rounded-lg border-gray-500 p-2 my-5 {task.isDone ? 'done' : 'not-done'}">
					<div class="flex">
						<label class="cursor-pointer label flex items-center w-11/12">
							<span class="label-text p-2">{task.desc}</span>
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
						<button class="task-menu-action w-1/12" data-target={`task-menu-content-${todo._id}-${task.id}`} on:click={toggleTaskMenu}>
									<div class="dot"></div>
									<div class="dot"></div>
									<div class="dot"></div>
						</button>
					</div>
						<div id={`task-menu-content-${todo._id}-${task.id}`} class="button-group justify-end hidden" >
							<button class="btn" on:click={() => {
								editMode = true;
								editId = task.id;
								todoDesc = task.desc;
							}}>
								<svg
									width="17"
									height="17"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									>
									<path
										fill-rule="evenodd"
										clip-rule="evenodd"
										d="M21.2635 2.29289C20.873 1.90237 20.2398 1.90237 19.8493 2.29289L18.9769 3.16525C17.8618 2.63254 16.4857 2.82801 15.5621 3.75165L4.95549 14.3582L10.6123 20.0151L21.2189 9.4085C22.1426 8.48486 22.338 7.1088 21.8053 5.99367L22.6777 5.12132C23.0682 4.7308 23.0682 4.09763 22.6777 3.70711L21.2635 2.29289ZM16.9955 10.8035L10.6123 17.1867L7.78392 14.3582L14.1671 7.9751L16.9955 10.8035ZM18.8138 8.98525L19.8047 7.99429C20.1953 7.60376 20.1953 6.9706 19.8047 6.58007L18.3905 5.16586C18 4.77534 17.3668 4.77534 16.9763 5.16586L15.9853 6.15683L18.8138 8.98525Z"
										fill="currentColor"
									/>
									<path
										d="M2 22.9502L4.12171 15.1717L9.77817 20.8289L2 22.9502Z"
										fill="currentColor"
									/>
									</svg>
							</button>
							<button class="btn" on:click={() => {
								editId = task.id
								removeTask();
							}}>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									>
									<path
										fill-rule="evenodd"
										clip-rule="evenodd"
										d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z"
										fill="currentColor"
									/>
									<path d="M9 9H11V17H9V9Z" fill="currentColor" />
									<path d="M13 9H15V17H13V9Z" fill="currentColor" />
									</svg>
							</button>
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
			<button class="btn btn-primary" on:click={editMode ? updateTodo : addTodo}>
				{ editMode ? 'Update' : 'Add' }
			</button>  
		</div>
	</div>
</div>
