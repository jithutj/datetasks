<script lang="ts">
	import Paper, { Title, Subtitle, Content } from '@smui/paper';
	import { LocalNotifications } from '@capacitor/local-notifications';
	

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

	LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction: any) => {
	if (notificationAction.actionId === 'ok') {
		// Call your app function and save notification status in localStorage
		console.log('Button clicked!');
		console.log(notificationAction.notification);
		alert('button clicked');
	}
	});
	
	const triggerNotification = () => {
		
		LocalNotifications.schedule({
		notifications: [
			{
			title: 'My Notification',
			body: 'This is a local notification!',
			id: 1, // Make sure to use a unique ID for each notification
			actionTypeId: 'reminder'
			},
		],
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
