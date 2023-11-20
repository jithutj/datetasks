<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { SvelteUIProvider } from '@svelteuidev/core';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	// import { pwaInfo } from 'virtual:pwa-info';
	import '../app.postcss';
	import IconButton from '@smui/icon-button';
	import Drawer, { Content, Header, Title as DrawerTitle, Subtitle } from '@smui/drawer';
	import List, { Item, Text } from '@smui/list';
	import Fab, { Icon } from '@smui/fab';
	import BottomAppBar, { Section as BottomSection, AutoAdjust } from '@smui-extra/bottom-app-bar';
	import CircularProgress from '@smui/circular-progress';
	// $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	let open = false;
	let menuActive = 'Inbox';
	let bottomAppBar: BottomAppBar;

	function setActive(value: string) {
		menuActive = value;
		open = false;
	}

	/* {@html webManifestLink} */ //should be under svelte head
	let isLoading = true;

	// Simulate an asynchronous operation (e.g., fetching data)
	onMount(async () => {
		// Simulate a delay (you can replace this with your actual async operation)
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// After the delay, set isLoading to false to hide the loading indicator
		isLoading = false;
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="/smui.css" media="(prefers-color-scheme: light)" />
	<link rel="stylesheet" href="/smui-dark.css" media="screen and (prefers-color-scheme: dark)" />
	<!-- Hint where we get fonts from. -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	<!-- Material Icons, Roboto, and Roboto Mono fonts -->
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Icons&Roboto+Mono:ital@0;1&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<SvelteUIProvider withNormalizeCSS withGlobalStyles>
	{#if isLoading}
					<div
						class="loading-indicator fixed w-full h-full bg-white z-50 flex items-center justify-center"
					>
					<div style="display: flex; justify-content: center">
						<CircularProgress
						  style="height: 32px; width: 32px;"
						  indeterminate
						  fourColor
						/>
					  </div>
					</div>
				{/if}
				<AutoAdjust {bottomAppBar}>
	<div class="main-container container py-1 m-auto" data-theme="cupcake">
		
		<div class="main-inner-container flexor">
			
				<div class="flexor-content px-2 py-2">
					<slot />
				</div>
			
				<BottomAppBar bind:this={bottomAppBar} variant="fixed" class="flex z-10">
					<BottomSection class="flex-1 p-3">
						<IconButton class="material-icons" aria-label="Menu" on:click={() => (open = !open)}>menu</IconButton>
					</BottomSection>
					<BottomSection class="flex-1 p-3 justify-right-forced">
						<IconButton class="material-icons" aria-label="Search">search</IconButton>
					</BottomSection>
				</BottomAppBar>
			
			<div
					on:keydown={() => {}}
					role="button"
					tabindex="0"
					on:click={() => (open = !open)}
					class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50"
					class:hidden={!open}
				/>
				<div class="drawer-container">
					<Drawer variant="modal" bind:open class="top-0 z-50">
						<Header>
							<DrawerTitle>NotesPro</DrawerTitle>
							<Subtitle>Organise your tasks</Subtitle>
						</Header>
						<Content>
							<List>
								<Item href="/" on:click={() => setActive('Home')} activated={menuActive === 'Home'}>
									<Icon class="material-icons pr-2">home</Icon>
									<Text>Home</Text>
								</Item>
							</List>
						</Content>
						<Item
							href="/about"
							on:click={() => setActive('About')}
							activated={menuActive === 'About'}
							class="absolute bottom-7"
						>
							<Text>About</Text>
						</Item>
					</Drawer>
				</div>
		</div>
	
	</div>
</AutoAdjust>
</SvelteUIProvider>

<SvelteToast />

<!-- {#await import('$lib/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await} -->

<style>
	/* Hide everything above this component. */
	:global(#smui-app),
	:global(body),
	:global(html) {
		display: block !important;
		height: auto !important;
		width: auto !important;
		position: static !important;
	}
	.drawer-container {
		position: relative;
		display: flex;
		max-width: 600px;
		overflow: hidden;
		z-index: 9999;
	}

	.main-inner-container  {
		width: 100%;
		height: 100vh;
		overflow: auto;
		display: inline-block;
		max-width: 990px;
		margin: auto;
		background-color: var(--mdc-theme-background, #fff);
	}

	.main-container {
		display: flex;
		flex-wrap: wrap;
		margin: auto;
		background-color: var(--mdc-theme-background, #fff);
	}

	.flexor {
		overflow: hidden;
		display: inline-flex;
		flex-direction: column;
	}

	.flexor-content {
		flex-basis: 0;
		height: 0;
		flex-grow: 1;
		overflow: auto;
	}
</style>
