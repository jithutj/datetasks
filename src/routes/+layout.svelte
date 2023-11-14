<script>
	import { SvelteUIProvider } from '@svelteuidev/core';
	import { SvelteToast } from '@zerodevx/svelte-toast'
	import { pwaInfo } from 'virtual:pwa-info'; 
	import '../app.postcss';
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '' 
</script>

<svelte:head> 
 	{@html webManifestLink} 
</svelte:head>

<SvelteUIProvider withNormalizeCSS withGlobalStyles>
	<slot />
</SvelteUIProvider>

<SvelteToast />

{#await import('$lib/ReloadPrompt.svelte') then { default: ReloadPrompt}}
  <ReloadPrompt />
{/await}

