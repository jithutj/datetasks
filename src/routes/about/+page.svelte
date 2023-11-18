<script lang="ts">
	import Paper, { Title, Subtitle, Content } from '@smui/paper';
	import { LocalNotifications } from '@capacitor/local-notifications';
	
	const triggerNotification = () => {
		LocalNotifications.schedule({
		notifications: [
			{
			title: 'My Notification',
			body: 'This is a local notification!',
			id: 1, // Make sure to use a unique ID for each notification
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
