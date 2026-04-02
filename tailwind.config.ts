import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: [
		'grid-rows-[0fr]',
		'grid-rows-[1fr]',
		'transition-[grid-template-rows]'
	],
	blocklist: ['[-:.]'],
	theme: {},
	plugins: []
} satisfies Config;