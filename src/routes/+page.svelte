<script lang="ts">
	import { TaskComponent, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateISO, formatDateISODateOnly } from '$lib/utils/date';
	import { onMount, tick } from 'svelte';
	import _ from 'lodash';
	import { DateInput } from 'date-picker-svelte'
	import { Plus } from 'radix-icons-svelte';

	import '../todo.css';
	import { Button } from '@svelteuidev/core';

	const db = Database.getInstance().getDB();

	let todos: TODO[] = [];

	const todayDate = new Date();
	const today = formatDateISODateOnly(todayDate);
	let DateInputValue = todayDate;

	const createTodo = async (shouldIndex: boolean = false, dateInput:Date = todayDate) => {
		const todoDefault: TODO[] = [
			{
				_id: formatDateISODateOnly(dateInput),
				dateIso: formatDateISO(dateInput),
				tasks: []
			}
		];

		const result = await db.put(todoDefault);

		if (shouldIndex) {
			await db.createIndex({
				index: {
					fields: ['_id'],
					name: 'idindex'
				}
			});
		}

		const mergedArray = _.merge(todoDefault, result);

		// Modify the merged array to omit "ok" and "id" keys and rename "rev" to "_rev"
		return mergedArray.map((item) => {
			//@ts-ignore
			const { ok, id, rev, ...rest } = item;
			return { ...rest, _rev: rev };
		});
	};

	const addDate = async () => {
		try {
			const todoUpdatedWithRev = await createTodo(false, DateInputValue);
			await tick();
			todos = _.orderBy([...todos, ...todoUpdatedWithRev], ['_id']);
			//@ts-ignore
			document.getElementById('add_date_modal').close();
		}catch (err) {
			console.log('Todo Date Creattion failed', err);
		}
	}

	onMount(async () => {
		try {
			const { docs } = await db.find({
				selector: {},
				sort: [{ _id: 'desc' }],
				limit: 5
			});

			if (!docs.length) {
				try {
					console.log('Todo initialized');
					const todoUpdatedWithRev = await createTodo(true);
					todos = [...todos, ...todoUpdatedWithRev];
				} catch (err) {
					console.log('Todo initialization failed', err);
				}
			} else {
				let todoUpdatedWithRev = docs;
				//@ts-ignore
				const isTodayExist = todoUpdatedWithRev.some((item) => item._id === today);
				if (!isTodayExist) {
					const { docs: todayDoc } = await db.find({
						selector: {'_id': { $eq: today }},
						limit: 1
					});
					if (!todayDoc.length) {
						todoUpdatedWithRev = await createTodo();
					} else {
						todoUpdatedWithRev = [...todoUpdatedWithRev, ...todayDoc];
					}
				}

				await tick();
				//@ts-ignore
				todos = _.orderBy([...todos, ...todoUpdatedWithRev], ['_id']);
			}
		} catch (err) {
			console.log(err);
		}
	});

	const removeTodo = async (todoId: TODO['_id']) => {
		try {
		const removedDoc = _.remove(todos, { '_id': todoId });
		todos = todos;
		await tick()
		//@ts-ignore
		await db.remove(removedDoc[0]);
		} catch (err) {
			console.log(err);
		}
	}
	// $: todoCount = todos.length;
</script>

<section
	id="dt-todo-container"
	class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3 max-h-screen overflow-y-auto"
	data-theme="cupcake"
>
	<header class="fixed top-0 left-0 right-0 z-50 bg-neutral">
		<div>
		<h2 class="text-xl font-bold mt-5 text-center text-white">DateTask App</h2>
	</div>
<div class="flex justify-end px-4">
		<Button slot="control" ripple on:click={()=> { 
			//@ts-ignore
			document.getElementById('add_date_modal').showModal()
		} } override={{
							border: 'none',
							background: 'transparent',
							'&:hover': {
								background: 'transparent'
							}
						}}>
			<Plus /> Add date
		</Button>
	</div>
		<div class="divider mb-0 my-0" />
	</header>
	<div class="dt-todo-task-container mt-32">
		{#each todos as todo, i (todo._id)}
			<TaskComponent {todo} isOpen={todo._id === today} containerId="dt-todo-container" removeTodo={removeTodo} />
		{/each}
	</div>

	<dialog id="add_date_modal" class="modal">
		<div class="modal-box flex flex-col">
		<form method="dialog">
			<!-- if there is a button in form, it will close the modal -->
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">X</button>
		</form>
		  <h3 class="font-bold text-lg mb-10">Add Date</h3>
		  <div class="DateInputWrapper mr-2 self-center">
			<DateInput format="yyyy-MM-dd" closeOnSelection={true} bind:value={DateInputValue} />
		</div>
		<div class="flex-grow"></div>
		<div class="modal-action self-end">
			<button class="btn btn-neutral text-white" on:click={addDate}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" fill="currentColor" /></svg>
				Submit
			</button>
		  </div>
		</div>
	  </dialog>
	<p class="text-right pt-10">Made with Love by <b>Jithu TJ</b></p>
</section>
<style>
	.modal-box {
		min-height: 370px;
	}
</style>
