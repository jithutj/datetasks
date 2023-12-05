import Database from '$lib/Database';
import type { TODO } from '$lib/types';
import { tick } from "svelte";

export async function load({ url }) {
    
    const todoId: string = url.searchParams.get('todoid') || '';

    if (todoId) {

        try {
            const db = Database.getInstance().getDB();
            const taskData: TODO = await db.get(todoId);
            await tick();

            return {
                taskData
            };   
        }catch(err) {
            console.log(err)
        }
    }
}