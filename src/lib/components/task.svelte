<script lang="ts">
	import { confirmPopup, Database } from '$lib';
	import type { TODO } from '$lib/types';
	import { Menu } from '@svelteuidev/core';
	//@ts-ignore
	import { Content as AccordionContent } from '@smui-extra/accordion';

	import IconButton from '@smui/icon-button';
	import { default as MaterialMenu } from '@smui/menu';
	import List, { Item, Text, Meta, Graphic } from '@smui/list';
	import Checkbox from '@smui/checkbox';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';

	/** parent props - two way binding */
	export let todo: TODO;
	export let openPopup: boolean;
	export let taskSaveData: TODO;
	export let removeTodo: (todoId: TODO['_id'], todoRev: TODO['_rev']) => {};
	export let toggleCompleted: (e: CustomEvent, todo: TODO) => {};
	/** // parent props */

	const db = Database.getInstance().getDB();
</script>

<AccordionContent class="!px-0">
	<div class="dt-todo-task-container">
		<ContextMenu.Root>
			<List class={`mb-2 task-list ${todo.isDone && 'task-done'}`}>
				<ContextMenu.Trigger>
					<Item class="flex items-center">
						<Graphic>
							<Checkbox
								on:click={(e) => {
									todo.isDone = !todo.isDone;
									toggleCompleted(e, todo);
								}}
								value={todo._id}
								bind:checked={todo.isDone}
							/>
						</Graphic>
						<Text
							on:click={() => {
								/* viewMode = true;
										addMode = false;
										editMode = false;
										taskSaveData = { ...task };
										openPopup = true; */
							}}
							class="w-full">{todo.desc}</Text
						>
						<Meta>
							<Menu placement="end" gutter={5} size="xs" class="bg-transparent p-0 border-none">
								<IconButton slot="control" class="material-icons pr-0 text-right"
									>more_vert</IconButton
								>

								<Menu.Item class="p-0">
									<MaterialMenu static>
										<List>
											<Item
												on:SMUI:action={() => {
													taskSaveData = { ...todo };
													openPopup = true;
												}}
											>
												<Text>Edit</Text>
											</Item>
											<Item
												on:SMUI:action={() => {
													confirmPopup('Remove Note', 'Are you sure you want to delete?', () =>
														removeTodo(todo._id, todo._rev)
													);
												}}
											>
												<Text>Delete</Text>
											</Item>
										</List>
									</MaterialMenu>
								</Menu.Item>
							</Menu>
						</Meta>
					</Item>
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item
						on:click={() => {
							/* viewMode = false;
									addMode = false;
									if (!editMode || editId !== todo._id) {
										editMode = true;
										editId = todo._id;
										taskSaveData = { ...task };
									}
									openPopup = true; */
						}}>Edit</ContextMenu.Item
					>
					<ContextMenu.Item
						on:click={() => {
							confirmPopup('Remove Note', 'Are you sure you want to delete?', () =>
								removeTodo(todo._id, todo._rev)
							);
						}}>Delete</ContextMenu.Item
					>
				</ContextMenu.Content>
			</List>
		</ContextMenu.Root>
	</div>
</AccordionContent>
