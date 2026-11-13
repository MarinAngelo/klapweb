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
	theme: {
		extend: {
			/**
			 * Theme colors from Prismic (set at runtime as CSS variables, see themeUpdater.ts).
			 * → text-page, bg-page-bg, border-page, text-panel …
			 * Opacity modifiers (bg-page/50) do not work with these; use color-mix in app.css instead.
			 */
			colors: {
				page: 'var(--page-color)',
				'page-bg': 'var(--page-bg-color)',
				'page-link': 'var(--page-link-color)',
				'page-link-hover': 'var(--page-link-hover-color)',
				header: 'var(--header-color)',
				'header-bg': 'var(--header-bg-color)',
				// Contrast-safe derived colors (themeUpdater → updateContrastColors)
				panel: 'var(--panel-color, var(--page-color))',
				'panel-bg': 'var(--panel-bg, var(--page-bg-color))',
				'btn-solid': 'var(--btn-solid-color, var(--page-bg-color))'
			}
		}
	},
	plugins: []
} satisfies Config;
