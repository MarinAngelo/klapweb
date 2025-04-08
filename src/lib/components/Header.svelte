<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import clsx from 'clsx';

	import Bounded from './Bounded.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let layout: Content.LayoutDocument;
	console.log('Header', { settings, navigation, layout });

	const convertNumber = (n) => {
		return parseFloat((0.1 + ((n - 1) / 98) * 0.89).toFixed(2));
	};

	// Fallbacks direkt
	const bannerTop = layout.data?.banner_top || false;
	
	// Fallbacks aus app.css verwenden
	const bgOpacity = convertNumber(layout.data?.bg_opacity || 'var(--header-bg-opacity' );
	const bgColor = layout.data?.header_bg_color || 'var(--header-bg-color)';
	const headerColor = layout.data?.header_color || 'var(--header-color)';
</script>

<Bounded
	tag="header"
	yPadding="sm"
	class={clsx({ 'absolute inset-x-0 top-0': bannerTop })}
	style="background-color: {bgColor}; opacity: {bgOpacity}; color: white; z-index: 9999;"
>
	<!-- Beinhaltet nur den Text nicht die ganze Kopfzeile -->
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 leading-none">
		<a href="/" class="text-xl font-semibold tracking-tight header-color"  style="--my-header-color: {headerColor};">
			<PrismicText field={settings.data.siteTitle} />
		</a>
		<nav>
			<ul class="flex flex-wrap gap-6 md:gap-10">
				{#each navigation.data?.links as item}
					<li class="font-semibold tracking-tigh header-color" style="--my-header-color: {headerColor};">
						<PrismicLink field={item.link}>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/each}
			</ul>
		</nav>
	</div>
</Bounded>

<style>
/* 	:global(.header) {
		background-color: var(--color-bg);
	} */
    .header-color {
        color: var(--my-header-color);
    }
</style>
