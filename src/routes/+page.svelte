<script lang="ts">
	import { TaskComponent, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateISO, formatDateOnly, formatDateRegular } from '$lib/utils/date';
	import { onMount, tick } from 'svelte';
	import _ from 'lodash';
	/* import { DateInput } from 'date-picker-svelte'; */
	import { DotsHorizontal, Plus } from 'radix-icons-svelte';
	import { toast } from '@zerodevx/svelte-toast';

	import '../todo.css';
	import { Button } from '@svelteuidev/core';
	import Accordion from '@smui-extra/accordion';
	import { mdiPlus } from '@mdi/js';
	import Fab, { Icon } from '@smui/fab';
/* 	import Dialog, { Title, Content as DialogContent, Actions } from '@smui/dialog';
	import { Label, default as MateriaButton } from '@smui/button';
	import Header from '@smui-extra/accordion/src/Header.svelte'; */
	import { error } from '@sveltejs/kit';
	import AirDatepicker from 'air-datepicker';
	import AirDatelocaleEn from 'air-datepicker/locale/en';
	import 'air-datepicker/air-datepicker.css';


	const db = Database.getInstance().getDB();

	let todos: TODO[] = [];
	let todoPrevPaginationStartid: string | null = null;
	let todoNextPaginationStartid: string | null = null;

	const todayDate = new Date();
	const today = formatDateOnly(todayDate);
	let DateInputValue = todayDate;

	const createTodo = async (shouldIndex: boolean = false, dateInput: Date = todayDate) => {
		const todoDefault: TODO = {
			_id: formatDateOnly(dateInput),
			dateIso: formatDateISO(dateInput),
			tasks: []
		};
		try {
			const result = await db.put(todoDefault);

			await tick();

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
			const { ok, id, rev, ...rest } = mergedArray;
			return [{ ...rest, _rev: rev }];
		} catch (err) {
			//@ts-ignore
			throw error(err.status, err.message);
		}
	};

	const addDate = async ($dateTarget: any) => {
		try {
			console.log(DateInputValue)
			console.log(formatDateOnly(DateInputValue))
			const isDateExist = todos.some((item) => item._id === formatDateOnly(DateInputValue));
			if (!isDateExist) {
				const { docs: isDateExistInDb } = await db.find({
					selector: { _id: { $eq: formatDateOnly(DateInputValue) } },
					limit: 1
				});
				await tick();
				if (isDateExistInDb.length) {
					toast.push('Date already exist', {
						classes: ['warn']
					});
					throw error(403, 'Date already exists');
				}
				const todoUpdatedWithRev = await createTodo(false, DateInputValue);
				await tick();
				todos = _.orderBy([...todos, ...todoUpdatedWithRev], ['_id']);
				$dateTarget.hide();
			} else {
				toast.push('Date already exist', {
					classes: ['warn']
				});
			}
		} catch (err) {
			console.log('Todo Date Creattion failed', err);
		}
	};

	onMount(async () => {
		try {
			const { docs } = await db.find({
				selector: { _id: { $lte: today } },
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
						selector: { _id: { $eq: today } },
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

		new AirDatepicker('#add-todo-trigger', {
			isMobile: true,
			locale: AirDatelocaleEn,
			buttons: [
				{
					content(dp) {
						return 'Add';
					},
					onClick(dp) {
						//@ts-ignore
						const dpDate = dp.lastSelectedDate ?? todayDate;
						//@ts-ignore
						DateInputValue = formatDateRegular(dpDate);
						
						addDate(dp);
					}
				}
			],
			onSelect: ({ datepicker }) => {
				//@ts-ignore
				datepicker.$el.value = ''
			}
		});
	});

	const removeTodo = async (todoId: TODO['_id']) => {
		try {
			const removedDoc = _.remove(todos, { _id: todoId });
			//@ts-ignore
			await db.remove(removedDoc[0]);
			await tick();
			todos = todos;
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

	$: if (todos.length) {
		setMoreStartEndIds();
	}
	// let openPopup = false;

</script>

<section
	id="dt-todo-container"
	class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3 max-h-screen overflow-y-auto"
	data-theme="cupcake"
>
	<div class="dt-todo-task-container">
		{#if todoPrevPaginationStartid}
			<Button
				slot="control"
				ripple
				variant="default"
				on:click={() => getMoreDates('prev')}
				override={{
					border: 'none',
					background: 'transparent',
					'&:hover': {
						background: 'transparent'
					}
				}}><DotsHorizontal /> Load Previous Dates</Button
			>
		{/if}
		<div class="accordion-container">
			<Accordion>
				{#each todos as todo, i (todo._id)}
					<TaskComponent
						{todo}
						isOpen={todo._id === today}
						containerId="dt-todo-container"
						{removeTodo}
						bind:todos={todos}
						createTodo={createTodo}
					/>
				{/each}
			</Accordion>
		</div>
		{#if todoNextPaginationStartid}
			<Button
				slot="control"
				ripple
				variant="default"
				on:click={() => getMoreDates('next')}
				override={{
					border: 'none',
					background: 'transparent',
					'&:hover': {
						background: 'transparent'
					}
				}}><DotsHorizontal /> Load Next Dates</Button
			>
		{/if}
		<div class="flexy z-auto fixed bottom-7 left-1/2 transform -translate-x-1/2">
			<div class="margins">
				<Fab>
					<Icon tag="svg" viewBox="2 2 20 20">
						<path fill="currentColor" d={mdiPlus} />
					</Icon>
					<input type="button" id="add-todo-trigger" class="absolute w-full h-full" />
				</Fab>
			</div>
		</div>
	</div>
	<!-- <Dialog
		bind:open={openPopup}
		fullscreen
		aria-labelledby="dd-date-popup-title"
		aria-describedby="dd-date-popup-content"
		surface$style="min-height: 50vh; max-height: 60vh;width: 300px;max-width: calc(100vw - 32px);"
	>
		<Title id="add-date-popup-title" class="text-center">Add date</Title>
		<DialogContent id="add-date-popup-content" class="text-center">
			<DateInput format="yyyy-MM-dd" visible closeOnSelection={true} bind:value={DateInputValue} />
		</DialogContent>
		<Actions>
			<MateriaButton on:click={() => (openPopup = false)}>
				<Label>Cancel</Label>
			</MateriaButton>
			<MateriaButton on:click={addDate}>
				<Label>Submit</Label>
			</MateriaButton>
		</Actions>
	</Dialog> -->
</section>
