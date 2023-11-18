// import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { adapter } from './adapter.mjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess({})],

	kit: {
		adapter,
		/* serviceWorker: {
			register: false,
		},
		files: {
			// you don't need to do this if you're using generateSW strategy in your app
			serviceWorker: 'src/prompt-sw.ts',
		} */
	}
};

export default config;
