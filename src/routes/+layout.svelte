<script>
	import { SvelteUIProvider } from '@svelteuidev/core';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { pwaInfo } from 'virtual:pwa-info';
	import '../app.postcss';
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifestLink}
	<script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js">
	</script>
	<script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js">
	</script>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css" />
</svelte:head>

<SvelteUIProvider withNormalizeCSS withGlobalStyles>
	<slot />
</SvelteUIProvider>

<SvelteToast />

{#await import('$lib/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await}
