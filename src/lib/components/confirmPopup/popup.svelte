<script lang="ts">
    import Button, { Label } from "@smui/button";
	import Dialog, { Actions, Content, Title } from "@smui/dialog";
    import { popupState } from './store';
</script>

<Dialog
	bind:open={$popupState.openConfirmPopup}
	aria-labelledby="confirm-popup-title"
	aria-describedby="confirm-popup-content"
	class="mdc-dialog-position-bottom"
	style="z-index: 9999"
>
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="confirm-popup-title">{$popupState.confirmPopupTitle}</Title>
	<Content id="confirm-popup-content">{$popupState.confirmPopupContent}</Content>
	<Actions>
		<Button on:click={() => ($popupState.openConfirmPopup = false)}>
			<Label>{$popupState.confirmPopupButtonNo}</Label>
		</Button>
		<Button class="!bg-red-700 !text-white" on:click={() => $popupState.confirmPopupCallback()}>
			<Label>{$popupState.confirmPopupButtonYes}</Label>
		</Button>
	</Actions>
</Dialog>