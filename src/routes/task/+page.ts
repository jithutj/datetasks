import { getTaskById } from '$lib/models/task';
import { formatDateReadable } from "$lib/utils/date";
import { tick } from "svelte";

export async function load({ url }) {
    
    const taskId: number | null = Number(url.searchParams.get('taskid')) || null;
    const todoId: string = url.searchParams.get('todoid') || '';

    if (taskId && todoId) {

        const taskData = await getTaskById(todoId, taskId);
        await tick();

        return {
            taskDate: formatDateReadable(todoId),
            taskData
        };   
    }
}