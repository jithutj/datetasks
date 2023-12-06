
import { popupState } from "./store";
import Popup from './popup.svelte';

const confirmPopup = (
	title: string,
	content: string,
	cb: () => any,
	buttonNo?: string,
	buttonYes?: string
): void => {
	popupState.update(state => ({
		...state,
		confirmPopupTitle: title,
		confirmPopupContent: content,
		confirmPopupCallback: cb,
		confirmPopupButtonNo: buttonNo ?? state.confirmPopupButtonNo,
		confirmPopupButtonYes: buttonYes ?? state.confirmPopupButtonYes,
		openConfirmPopup: true
	}));
};

export { Popup };
export default confirmPopup;


