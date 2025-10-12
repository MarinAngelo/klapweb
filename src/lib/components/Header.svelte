<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import type { Content } from '@prismicio/client';
	import clsx from 'clsx';
	import { onMount } from 'svelte';
	import { isMenuOpen } from '$lib/stores/isMenuOpen';
	import { PrismicImage, PrismicText } from '@prismicio/svelte';
	import { hexToRgba } from '$lib/utils/color';
	import Bounded from './Bounded.svelte';
	import Navbar from './Navbar.svelte';

	export let settings: Content.SettingsDocument;
	export let navigation: Content.NavigationDocument;
	export let prismicTheme: Content.PrismicThemeDocument;

	let headerEl: HTMLElement;
	const logoHeight = prismicTheme.data.logo_height || 3; // Standardwert 3rem
	const siteTitleFontSize = settings.data.site_title_font_size || 1.5;
	const siteSubtitleFontSize = settings.data.site_sub_title_font_size || 1;
	const headerfontSize = prismicTheme.data.header_font_size || 1.4;

	function updateHeaderHeight() {
		if (headerEl) {
			headerHeight.set(headerEl.offsetHeight);
		}
	}

	onMount(() => {
		updateHeaderHeight();
		const observer = new ResizeObserver(updateHeaderHeight);
		observer.observe(headerEl);
		return () => observer.disconnect();
	});

	$: bannerTop = $theme.bannerTop;
	$: headerBgColor = $theme.headerBgColor;
	$: headerBgOpacity = $theme.headerBgOpacity;
	$: headerColor = $theme.headerColor;
	$: headerLinkColor = $theme.headerLinkColor;
	$: headerLinkHoverColor = $theme.headerLinkHoverColor;
	$: currentPath = $page.url.pathname;
	$: headerBgColorRgba = hexToRgba(headerBgColor, headerBgOpacity);
	// Dynamischer Style je nach Menüstatus
	$: headerStyle = `
		background-color: ${headerBgColorRgba};
		color: ${headerColor};
		position: ${bannerTop ? 'absolute' : 'relative'};
		z-index: 100;
	`;
</script>

<Bounded
	tag="header"
	yPadding="none"
	tMargin="lg"
	bind:elementRef={headerEl}
	class={clsx(
		{ 'absolute inset-x-0 top-0': bannerTop },
		'transition-opacity duration-300 ease-in-out'
	)}
	style={headerStyle}
>
	<!-- Logo -->
	<div class="flex {$isMenuOpen ? '' : 'items-center'} justify-between w-full">
		<div class="logo m-0">
			{#if prismicTheme.data.logo?.url}
				<a href="/" class="flex items-center mt-2 mb-2">
					<PrismicImage
						field={prismicTheme.data.logo}
						alt={prismicTheme.data.logo.alt}
						class="w-auto"
						style="height: {logoHeight}rem;"
					/>
				</a>
			{:else}
				<!-- Text-Logo -->
				<a href="/" class="mt-6 mb-6 inline-block" style="color: {headerColor};">
					<span
						class="text-xl font-semibold tracking-tight"
						style="font-size: {siteTitleFontSize}rem;"
					>
						<PrismicText field={settings.data.site_title} /><br />
					</span>
					<span style="font-size: {siteSubtitleFontSize}rem;">
						<PrismicText field={settings.data.site_sub_title} class="text-sm" />
					</span>
				</a>
			{/if}
		</div>
		<Navbar
			{navigation}
			{headerColor}
			{headerBgColor}
			{headerLinkColor}
			{headerLinkHoverColor}
			{settings}
			{currentPath}
			{prismicTheme}
			{headerfontSize}
			{headerHeight}
		/>
	</div>
</Bounded>
