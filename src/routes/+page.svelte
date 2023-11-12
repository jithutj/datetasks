<script lang="ts">
	import { TaskComponent, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { formatDateISO } from '$lib/utils/date';
	import { onMount } from 'svelte';
	import _ from 'lodash';

	import '../todo.css';

	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	var yesterday2 = new Date();
	yesterday2.setDate(yesterday.getDate() - 2);

	const db = Database.getInstance().getDB();

	let todos: TODO[] = [];

	onMount(async () => {
		try {
			const { docs } = await db.find({
				selector: {date: {$lte: formatDateISO(new Date()) }}
			});

			if (!docs.length) {
				const todo: TODO[] = [	
					{
						_id: '1',
						date: formatDateISO(new Date()),
						tasks: []
					}
				];

				try {
					const result = await db.bulkDocs(todo);

					await db.createIndex({
						index: {
						fields: ['date'],
						name: 'dateindex'
						}
					});

					// Merge the arrays
					const mergedArray = _.merge(todo, result);

					// Modify the merged array to omit "ok" and "id" keys and rename "rev" to "_rev"
					const todoUpdatedWithRev = mergedArray.map(item => {
						//@ts-ignore
						const { ok, id, rev, ...rest } = item;
						return { ...rest, _rev: rev };
					});
					console.log('Todo initialized');
					todos = [...todos, ...todoUpdatedWithRev];
				} catch (err) {
					console.log('Todo initialization failed', err);
				}
			} else {
				todos = [...todos, ...docs];
			}
		} catch (err) {
			console.log(err);
		}
	});

	$: todoCount = todos.length;
</script>

<section
	id="dt-todo-container"
	class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3 max-h-screen overflow-y-auto"
	data-theme="cupcake"
>
	<h2 class="text-2xl font-bold mt-5 text-center">DateTask App</h2>
	<div class="divider" />
	<div class="dt-todo-task-container">
		{#each todos as todo, i (todo._id)}
			<TaskComponent {todo} isOpen={i === todoCount - 1} containerId="dt-todo-container" />
		{/each}
	</div>
	<p class="text-right pt-10">Made with Love by <b>Jithu TJ</b></p>
</section>
