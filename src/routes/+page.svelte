<script lang="ts">
	import { TaskComponent } from '$lib';
	import type { TODO } from '$lib/types';

	import '../todo.css';

	let todos: TODO[] = [
		{
			id: 1,
			date: '2023-11-10',
			tasks: [
				{
					id: 1,
					desc: 'Task one to do',
					isDone: false
				},
				{
					id: 2,
					desc: 'Task two to do',
					isDone: true
				}
			]
		},
		{
			id: 2,
			date: '2023-11-09',
			tasks: [
				{
					id: 1,
					desc: 'Task one to do',
					isDone: false
				},
				{
					id: 2,
					desc: 'Task two to do',
					isDone: true
				}
			]
		}
	];

	const todoCount = todos.length;
</script>

<section class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3" data-theme="cupcake">
	<h2 class="text-2xl font-bold mt-5">DateTask App</h2>
	<div class="divider" />
	<div class="dt-todo-task-container">
		{#each todos as todo, i (todo.id)}
			<TaskComponent {todo} isOpen={i === todoCount - 1} />
		{/each}
	</div>
</section>
