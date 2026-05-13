import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0', // oder einfach true
		fs: {
			// Allow access to files from the project root.
			allow: ['..']
		}
	}
});
