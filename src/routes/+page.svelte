<script lang="ts">
	import { TaskComponent, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateISO, formatDateOnly, formatDateRegular } from '$lib/utils/date';
	import { onMount, tick } from 'svelte';
	import _ from 'lodash';
	import { toast } from '@zerodevx/svelte-toast';
	import '../todo.css';
	import Accordion from '@smui-extra/accordion';
	import { mdiPlus } from '@mdi/js';
	import Fab, { Icon } from '@smui/fab';
	import { default as MaterialButton } from '@smui/button';
	import { error } from '@sveltejs/kit';
	import AirDatepicker from 'air-datepicker';
	import AirDatelocaleEn from 'air-datepicker/locale/en';
	import 'air-datepicker/air-datepicker.css';
	import { NotificationService } from '$lib/utils/NotificationService';

	const db = Database.getInstance().getDB();
	const notificationService = NotificationService.getInstance();

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
				console.log('index triggered')
				await db.createIndex({
					index: {
						fields: ['_id']
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
			const isDateExist = todos.some((item) => item._id === formatDateOnly(DateInputValue));
			if (!isDateExist) {
				const { docs: isDateExistInDb } = await db.find({
					selector: { _id: { $eq: formatDateOnly(DateInputValue) } },
					limit: 1
				});
				await tick();
				if (isDateExistInDb.length) {
					//@ts-ignore
					todos = _.orderBy([...todos, isDateExistInDb[0]], ['_id']);
				} else {
					const todoUpdatedWithRev = await createTodo(false, DateInputValue);
					await tick();
					todos = _.orderBy([...todos, ...todoUpdatedWithRev], ['_id']);
				}
				
				$dateTarget.hide();
			} else {
				toast.push('Date already added, click on "Add Note" inside the date', {
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

		setTimeout(() => {
			notificationService.checkOrRequestPermission();
		}, 3000);

		notificationService.registerActionTypes([{
				id: 'reminder',
				actions: [
					{
						id: 'view',
						title: "View"
					}
				]
			}]
		)

		notificationService.createChannel({
			id: 'notespro-reminder',
			name: 'Notespro reminder notifications',
			description: 'Reminder notification channel',
			importance: 5, // High importance
			sound: 'smart_alarm.mp3',
			visibility: 1, // Heads-up notification
			vibration: true,
			lights: true
      	})

		new AirDatepicker('#add-todo-trigger', {
			isMobile: true,
			locale: AirDatelocaleEn,
			buttons: [
				{
					content(dp) {
						return 'ADD DATE';
					},
					tagName: 'button',
					className: '!bg-blue-700 !text-white',
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
				datepicker.$el.value = '';
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

<section id="dt-todo-container" class="dt-todo-container">
	<div class="dt-todo-task-container">
		{#if todoPrevPaginationStartid}
			<MaterialButton on:click={() => getMoreDates('prev')}
				><Icon class="material-icons">arrow_back_ios</Icon> Show Previous</MaterialButton
			>
		{/if}
		<div class="accordion-container">
			<Accordion multiple>
				{#each todos as todo, i (todo._id)}
					<TaskComponent {todo} isOpen={true} {removeTodo} bind:todos {createTodo} />
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
				<Fab>
					<Icon tag="svg" viewBox="2 2 20 20">
						<path fill="currentColor" d={mdiPlus} />
					</Icon>
					<input type="button" id="add-todo-trigger" class="absolute w-full h-full" />
				</Fab>
			</div>
		</div>
	</div>
</section>
