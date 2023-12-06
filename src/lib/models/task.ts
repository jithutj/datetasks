import Database from "$lib/Database";
import { tick } from "svelte";

export const getTaskById = async (todoId: string, taskId: number) => {
    const db = Database.getInstance().getDB();
    try {
        const result = await db.find({
        selector: {
            _id: { $eq: todoId },
        },
        fields: ['tasks'],
        limit: 1
        });
        await tick();
        if (result.docs.length > 0) {
            //@ts-ignore
            return result.docs[0].tasks.find(task => task.id === taskId);
        } else {
            // Task not found
            return null;
        }
    } catch (error) {
        return null;
    }
}