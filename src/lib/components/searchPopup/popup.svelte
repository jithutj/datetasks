<script lang="ts">
	import Button, { Icon, Label } from '@smui/button';
	import Dialog, { Actions, Content, Title } from '@smui/dialog';
	import AirDatepicker from 'air-datepicker';
	import AirDatelocaleEn from 'air-datepicker/locale/en';
	import { onMount } from 'svelte';

	export let isSearchPopupOpen = false;
	export let searchCallback: (dpMin: any, dpMax: any) => void;

	let dpMin: any, dpMax: any;

	onMount(() => {
		dpMin = new AirDatepicker('#el1', {
			inline: true,
			locale: AirDatelocaleEn,
			onSelect({ date }) {
				dpMax.update({
					minDate: date
				});
                console.log(dpMin)
			}
		});

		dpMax = new AirDatepicker('#el2', {
			inline: true,
			locale: AirDatelocaleEn,
			onSelect({ date }) {
				dpMin.update({
					maxDate: date
				});
			}
		});
		const searchIcon = document.getElementById('search-icon');
		if (searchIcon) {
			searchIcon.addEventListener('click', () => {
				isSearchPopupOpen = true;
			});
		}
	});
</script>

<Dialog
	bind:open={isSearchPopupOpen}
	aria-labelledby="search-popup-title"
	aria-describedby="search-popup-content"
	surface$style="width: 100%; height: 100%; min-width: 100vw; overflow-x: hidden"
	style="z-index: 9999"
>
	<!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
	<Title id="search-popup-title">Search By Date</Title>
	<Content id="confirm-popup-content">
		<div class="flex flex-col items-center">
			<div class="mb-3">
				<input class="p-2 mb-1 rounded-sm w-full text-black" type="text" id="el1" placeholder="Date from" />
			</div>
			<div>
				<input class="p-2 mb-1 rounded-sm w-full text-black" type="text" id="el2" placeholder="Date to" />
			</div>
		</div>
	</Content>
	<Actions>
		<Button on:click={() => (isSearchPopupOpen = false)}>
			<Label>close</Label>
		</Button>
		<Button class="!bg-red-700 !text-white" on:click={() => searchCallback(dpMin, dpMax)}>
			<Label><Icon class="material-icons">search</Icon>Search</Label>
		</Button>
	</Actions>
</Dialog>
