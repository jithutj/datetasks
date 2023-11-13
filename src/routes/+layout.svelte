<script>
	import { pwaInfo } from 'virtual:pwa-info'; 
	import '../app.postcss';
	$: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '' 
</script>

<slot />
<svelte:head> 
 	{@html webManifestLink} 
</svelte:head>