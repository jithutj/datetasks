<script lang="ts">
	import { TaskComponent, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateISO, formatDateISODateOnly } from '$lib/utils/date';
	import { onMount, tick } from 'svelte';
	import _ from 'lodash';
	import { DateInput } from 'date-picker-svelte'
	import { DotsHorizontal, Plus } from 'radix-icons-svelte';
	import { toast } from '@zerodevx/svelte-toast'

	import '../todo.css';
	import { Button } from '@svelteuidev/core';
	import Accordion from '@smui-extra/accordion';
	import { mdiPlus } from '@mdi/js';
	import Fab, { Icon } from '@smui/fab';
	import Dialog, { Title, Content as DialogContent, Actions } from '@smui/dialog';
	import { Label, default as MateriaButton } from '@smui/button';
	import Header from '@smui-extra/accordion/src/Header.svelte';

	const db = Database.getInstance().getDB();

	let todos: TODO[] = [];
	let todoPrevPaginationStartid: string | null = null;

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

		const result = await db.bulkDocs(todoDefault);

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
			const isDateExist = todos.some((item) => item._id === formatDateISODateOnly(DateInputValue));
			if (!isDateExist) {
				const todoUpdatedWithRev = await createTodo(false, DateInputValue);
				await tick();
				todos = _.orderBy([...todos, ...todoUpdatedWithRev], ['_id']);
				openPopup = false;
			} else {
				toast.push('Date already exist', { 
					classes: ['warn']
				})
				openPopup = false;
			}
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
		//@ts-ignore
		await db.remove(removedDoc[0]);
		await tick()
		todos = todos;
		} catch (err) {
			console.log(err);
		}
	}

	const getPrevDates = async () => {
		const { docs: prevDocs } = await db.find({
			selector: { _id: { $lte: todoPrevPaginationStartid } },
			sort: [{ _id: 'desc' }],
			limit: 5
		});

		await tick()

		//@ts-ignore
		todos = _.orderBy([...todos, ...prevDocs], ['_id']);
	}

	const getPrevMoreId = async () => {
			const currentStartId = _.get(todos, '[0]._id')

			const { docs: prevDocsMore } = await db.find({
				selector: { _id: { $lt: currentStartId } },
				sort: [{ _id: 'desc' }],
				limit: 2
			});

			await tick()

			todoPrevPaginationStartid = prevDocsMore.length ? prevDocsMore[0]._id : null;	
	}

	$: if (todos.length) { getPrevMoreId() }
	let openPopup = false; 
</script>

<section
	id="dt-todo-container"
	class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3 max-h-screen overflow-y-auto"
	data-theme="cupcake"
>
	<div class="dt-todo-task-container">
		{#if todoPrevPaginationStartid}
		<Button slot="control" ripple variant="default" on:click={getPrevDates} override={{
			border: 'none',
			background: 'transparent',
			'&:hover': {
				background: 'transparent'
			}
		}}><DotsHorizontal /> Load Previous Dates</Button>
		{/if}
		<div class="accordion-container">
			<Accordion>
		{#each todos as todo, i (todo._id)}
			<TaskComponent {todo} isOpen={todo._id === today} containerId="dt-todo-container" removeTodo={removeTodo} />
		{/each}
	</Accordion>
	</div>
	</div>

	  <div class="flexy fixed z-50 bottom-7 left-1/2 transform -translate-x-1/2">
		<div class="margins">
		  <!--
			I'm using viewBox="2 2 20 20" instead of
			viewBox="0 0 24 24" because the mdiPlus icon
			is particularly small. This embiggens it.
		  -->
		  <Fab on:click={() => { openPopup = true }}>
			<Icon tag="svg" viewBox="2 2 20 20">
			  <path fill="currentColor" d={mdiPlus} />
			</Icon>
		  </Fab>
		</div>
	  </div>
	  <Dialog
		bind:open={openPopup}
		fullscreen
		aria-labelledby="dd-date-popup-title"
		aria-describedby="dd-date-popup-content"
		surface$style="min-height: 50vh; max-height: 60vh;width: 300px;max-width: calc(100vw - 32px);"
		>	
		<Header>
			<Title id="add-date-popup-title" class="text-center">Add date</Title>
		</Header>
		<DialogContent id="add-date-popup-content" class="text-center">
			<DateInput format="yyyy-MM-dd" closeOnSelection={true} bind:value={DateInputValue} />
		</DialogContent>
		<Actions>
			<MateriaButton on:click={() => openPopup = false }>
			<Label>Cancel</Label>
			</MateriaButton>
			<MateriaButton on:click={addDate}>
			<Label>Submit</Label>
			</MateriaButton>
		</Actions>
		</Dialog>
	<p class="text-right pt-10">Made with Love by <b>Jithu TJ</b></p>
</section>
