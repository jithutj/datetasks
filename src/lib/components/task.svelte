<script lang="ts">
	import type { TODO } from '$lib/types';
	import { formatDateReadable } from '$lib/utils/date';

	export let todo: TODO;
	export let isOpen: boolean;

	let todoDesc = '';
	const addTodo = () => {
		if (!todoDesc) return
        const todos = todo.tasks;
        let lastId = todos.length && todos.length > 1 ? todos[todos.length - 1].id
            : (todos.length ? todos[0].id : 0);

        todo.tasks = [...todos, { id: lastId + 1, desc: todoDesc, isDone: false }]
        todoDesc = ''
	};

	const toggleCompleted = (e: MouseEvent): void => {
		//@ts-ignore
		const taskid = parseInt(e.target.value);
        const index = todo.tasks.findIndex(todo => todo.id === taskid)
        todo.tasks[index].isDone = !todo.tasks[index].isDone;
	};
</script>

<div class="collapse collapse-plus bg-base-200 my-3">
	{#if isOpen}
		<input type="radio" name="todo-accordion" checked />
	{:else}
		<input type="radio" name="todo-accordion" />
	{/if}

	<div class="collapse-title text-xl font-medium">
		{formatDateReadable(todo.date)}
	</div>
	<div class="collapse-content">
		<ul>
			{#each todo.tasks as task, i (task.id)}
				<li class="border rounded-lg border-gray-500 p-2 my-5 {task.isDone ? 'done' : 'not-done'}">
					<div class="form-control">
						<label class="cursor-pointer label">
							<span class="label-text p-2">{task.desc}</span>
							<input
								type="checkbox"
								on:click={(e) => toggleCompleted(e)}
								value={task.id}
								class="checkbox checkbox-accent"
							/>
						</label>
					</div>
				</li>
			{/each}
		</ul>
		<div class="dt-todo-input-container mt-3">
			<textarea class="textarea textarea-bordered" bind:value={todoDesc} />
			<button class="btn btn-primary" on:click={addTodo}>Add</button>
		</div>
	</div>
</div>
