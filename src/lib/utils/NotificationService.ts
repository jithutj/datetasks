import { LocalNotifications } from '@capacitor/local-notifications';
import type {
	ActionType,
	Channel,
	LocalNotificationDescriptor,
	LocalNotificationSchema,
	PendingResult
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { tick } from 'svelte';

export enum ListenerEvents {
	localNotificationReceived = 'localNotificationReceived',
	localNotificationActionPerformed = 'localNotificationActionPerformed'
}
type ListenerEventsParam =
	| ListenerEvents.localNotificationReceived
	| ListenerEvents.localNotificationActionPerformed;

export class NotificationService {
	private static instance: NotificationService;
	private localNotifications: typeof LocalNotifications;

	private constructor() {
		this.localNotifications = LocalNotifications;
	}

	public static getInstance(): NotificationService {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
		}

		return NotificationService.instance;
	}

	public registerActionTypes(actions: ActionType[]) {
		if (Capacitor.isNativePlatform()) {
			this.localNotifications.registerActionTypes({
				types: [...actions]
			});
		}
	}

	public addListeners<T>(
		eventName: ListenerEventsParam,
		cb: (notification: T) => Promise<void> | void
	) {
		//@ts-ignore
		this.localNotifications.addListener(eventName, cb);
	}

	public async checkOrRequestPermission() {
		const { display } = await this.localNotifications.checkPermissions();
		await tick();

		let status = false;
		//request permission
		if (display === 'granted') {
			status = true;
		} else if (display === ('prompt' || 'prompt-with-rationale')) {
			const { display } = await this.localNotifications.requestPermissions();
			await tick();
			if (display === 'granted') {
				status = true;
			}
		}

		await tick();

		if (!status) {
			alert('You wont receive reminder notification unless you give notification permission');
		}

		return;
	}

	public createChannel(options: Channel) {
		if (Capacitor.isNativePlatform()) {
			this.localNotifications.createChannel(options);
		}
	}

	public scheduleNotification(data: LocalNotificationSchema[]): void {
		// Your notification logic using LocalNotifications
		this.localNotifications.schedule({
			notifications: data
		});
	}

	public getPending(): Promise<PendingResult> {
		return this.localNotifications.getPending();
	}

	public cancel(notificationIds: LocalNotificationDescriptor[]): Promise<void> {
		return this.localNotifications.cancel({
			notifications: notificationIds
		});
	}
}

// Example usage:
// const notificationService = NotificationService.getInstance();
