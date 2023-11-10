<script lang="ts">
	import { TaskComponent } from '$lib';
	import type { TODO } from '$lib/types';
    import { formatDateISO } from '$lib/utils/date';

	import '../todo.css';

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

	let todos: TODO[] = [
        {
			id: 1,
			date: formatDateISO(yesterday),
			tasks: []
		},
		{
			id: 2,
			date: formatDateISO(new Date()),
			tasks: []
		}
	];

	const todoCount = todos.length;

</script>

<section id="dt-todo-container" class="dt-todo-container container max-w-screen-sm mx-auto px-3 py-3 max-h-screen overflow-y-auto" data-theme="cupcake">
	<h2 class="text-2xl font-bold mt-5 text-center">DateTask App</h2>
	<div class="divider" />
	<div class="dt-todo-task-container">
		{#each todos as todo, i (todo.id)}
			<TaskComponent {todo} isOpen={i === todoCount - 1} />
		{/each}
	</div>
	<p class="text-right pt-10">With Love <b>Jithu TJ</b></p>
</section>