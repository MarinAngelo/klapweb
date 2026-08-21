import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: [
		'grid-rows-[0fr]',
		'grid-rows-[1fr]',
		'transition-[grid-template-rows]',
		'sm:grid-cols-2',
		'sm:grid-cols-3',
		'sm:grid-cols-4'
	],
	blocklist: ['[-:.]'],
	theme: {},
	plugins: []
} satisfies Config;
