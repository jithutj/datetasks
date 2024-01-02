import { NotificationService } from '$lib/utils/NotificationService.js';


const TitleMap: Record<string, string> = {
    'upcoming': 'Upcoming Reminders'
}

export async function load({ params: { slug } }) {
    
    const notificationService = NotificationService.getInstance();
    
    return {
        title: TitleMap[slug],
        pendings: await notificationService.getPending()
    }
}