import { writable } from 'svelte/store';

// Create a writable store with an object containing multiple variables
export const popupState = writable({
	openConfirmPopup: false,
	confirmPopupTitle: '',
	confirmPopupContent: '',
	confirmPopupCallback: () => {},
	confirmPopupButtonNo: 'No',
	confirmPopupButtonYes: 'Yes',
});