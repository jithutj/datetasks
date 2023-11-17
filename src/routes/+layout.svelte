<script lang="ts">
// @ts-nocheck

	import { SvelteUIProvider } from '@svelteuidev/core';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';
	import '../app.postcss';
	import TopAppBar, {
		  Row,
		  Section,
		  Title,
		  AutoAdjust,
		} from '@smui/top-app-bar';
		import IconButton from '@smui/icon-button';
	
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';

	let topAppBar: TopAppBar;
</script>

<svelte:head>
	{@html webManifestLink}
	<link rel="stylesheet" href="/smui.css" media="(prefers-color-scheme: light)" />
	<link
	rel="stylesheet"
	href="/smui-dark.css"
	media="screen and (prefers-color-scheme: dark)"
	/>
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
	<TopAppBar bind:this={topAppBar} variant="fixed">
		<Row>
		  <Section>
			<!-- <IconButton class="material-icons">menu</IconButton> -->
			<Title>NotesPro</Title>
		  </Section>
		  <!-- <Section align="end" toolbar>
			<IconButton class="material-icons" aria-label="Download"
			  >file_download</IconButton
			>
			<IconButton class="material-icons" aria-label="Print this page"
			  >print</IconButton
			>
			<IconButton class="material-icons" aria-label="Bookmark this page"
			  >bookmark</IconButton
			>
		  </Section> -->
		</Row>
	  </TopAppBar>
	  <AutoAdjust {topAppBar}>
		<slot />
	  </AutoAdjust>
</SvelteUIProvider>

<SvelteToast />

{#await import('$lib/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await}

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
  </style>


