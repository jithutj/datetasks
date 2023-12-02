import { getTaskById } from '$lib/models/task';
import { NotificationService } from '$lib/utils/NotificationService.js';
import { formatDateReadable } from "$lib/utils/date";
import { tick } from "svelte";


const TitleMap: Record<string, string> = {
    'upcoming': 'Upcoming Reminders'
}

export async function load({ params: { slug } }) {
    
    const notificationService = NotificationService.getInstance();

    let pendings = await notificationService.getPending();
    await tick()
    console.log(pendings)

    return {
        title: TitleMap[slug],
        pendings
    }
}