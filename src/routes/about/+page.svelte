<script lang="ts">
	import Paper, { Title, Subtitle, Content } from '@smui/paper';
	import { LocalNotifications } from '@capacitor/local-notifications';
	import { Dialog } from '@capacitor/dialog';
	

	LocalNotifications.registerActionTypes({
		types: [
			{
				id: 'reminder',
				actions: [
					{
						id: 'ok',
						title: "Ok"
					}
				]
			}
		]
	})

	const showAlert = async () => {
		await Dialog.alert({
			title: 'Stop',
			message: 'this is an error',
		});
	};


	LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: any) => {
	if (notificationAction.actionId === 'ok') {
		// Call your app function and save notification status in localStorage
		console.log('Button clicked!');
		console.log(notificationAction.notification);
		showAlert();
	}
	});

	LocalNotifications.addListener('localNotificationReceived', (notification: any) => {
	if (notification.id === 1) {
		showAlert();
	}
	});	
	
	const triggerNotification = () => {
		
		LocalNotifications.schedule({
		notifications: [
			{
			title: 'My Notification',
			body: 'This is a local notification!',
			id: 1, // Make sure to use a unique ID for each notification
			actionTypeId: 'reminder',
			schedule: { at: new Date(Date.now() + 1000 * 5) }
			},
			{
			title: 'My Notification 2',
			body: 'This is a local notification 2!',
			id: 2, // Make sure to use a unique ID for each notification
			actionTypeId: 'test'
			},
		],
		});

		LocalNotifications.registerActionTypes({
			types: [
				{
					id: 'reminder',
					actions: [
						{
							id: 'ok',
							title: 'Ok'
						}
					]
				},
				{
					id: 'test',
					actions: [
						{
							id: 'ok',
							title: 'Test Ok'
						}
					]
				}
			]
		})

		LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: any) => {
			if (notificationAction.actionId === 'ok') {
				alert('button clicked');
			}
		});
	}

</script>

<div class="paper-container">
	<Paper variant="outlined">
		<Title>Developed by <b>Jithu TJ</b></Title>
		<Subtitle>Email: jithu.developer@gmail.com</Subtitle>
		<Content>License: MIT</Content>
	</Paper>
</div>

<div class="pt-10">
	<button class="btn btn-accent" on:click={triggerNotification}>
		show notification
	</button>
</div>
