<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { headerHeight } from '$lib/stores/headerHeight';
	import type { Content, PrismicDocument } from '@prismicio/client';
	import { onMount } from 'svelte';
	import { isMenuOpen } from '$lib/stores/isMenuOpen';
	import { PrismicImage, PrismicText } from '@prismicio/svelte';
	import { hexToRgba } from '$lib/utils/color';
	import Bounded from './Bounded.svelte';
	import Navbar from './Navbar.svelte';

	export let settings: Content.SettingsDocument | undefined;
	export let navigation: Content.NavigationDocument | undefined;
	export let prismicTheme: PrismicDocument | undefined;
	export let lang: string | undefined;
	export let locales: string[] | undefined;
	export let showSwitcher: boolean | undefined;
	export let allAlternates: any[] = [];
	export let mainLang: string | undefined;
	console.log('MainLang in Header:', mainLang);

	// --- STATE ---
	let headerEl: HTMLElement | undefined;
	let observer: ResizeObserver;
	let landscapeQuery: MediaQueryList; // Neu: Listener für Landscape

	// --- STANDARDWERTE ---
	$: logoHeight = prismicTheme?.data?.logo_height || get(theme).logoHeight;
	$: siteTitleFontSize = prismicTheme?.data?.site_title_font_size || get(theme).siteTitleFontSize;
	$: siteTitleFont = prismicTheme?.data?.site_title_font?.data?.name || get(theme).siteTitleFont;
	$: siteSubtitleFontSize =
		prismicTheme?.data?.site_sub_title_font_size || get(theme).siteSubtitleFontSize;
	$: headerLinkFontSize =
		prismicTheme?.data?.header_link_font_size || get(theme).headerLinkFontSize;
	$: headerLinkColor = prismicTheme?.data?.header_link_color || get(theme).headerLinkColor;
	$: headerLinkHoverColor =
		prismicTheme?.data?.header_link_hover_color || get(theme).headerLinkHoverColor;

	// bannerTop direkt aus den Seitendaten lesen, nicht aus dem Store
	$: bannerTop = (() => {
		const slices = $page.data?.page?.data?.slices;
		if (!Array.isArray(slices)) return false;

		const overlappingSlice = slices.find(
			(s: any) =>
				(s.slice_type === 'hero' || (s.slice_type === 'p5_grafik' && s.variation === 'mitTitelbereich')) &&
				s.primary?.banner_overlap === true
		);
		return overlappingSlice !== undefined;
	})();

	$: headerColor = $theme.headerColor;

	const headerBgColor = prismicTheme?.data?.header_bg_color ?? get(theme).headerBgColor;
	// headerBgOpacity wird nur aus dem Titelbereich-Slice gesetzt, nicht aus prismicTheme
	$: headerBgOpacity = $theme.headerBgOpacity;
	// Wechsle zwischen transparent und fester Farbe basierend auf Menü-Status
	$: computedBgColor = $isMenuOpen ? headerBgColor : hexToRgba(headerBgColor, headerBgOpacity);

	function updateHeaderHeight() {
		// 1. ZUERST PRÜFEN: Mobile Landscape?
		// Wenn ja -> Sofort 0 zurückgeben und abbrechen.
		if (landscapeQuery && landscapeQuery.matches) {
			headerHeight.set(0);
			return;
		}

		// 2. Ansonsten: Messen
		if (headerEl) {
			// Wenn das Element per CSS (display: none) versteckt ist, ist offsetParent null
			if (headerEl.offsetParent === null) {
				headerHeight.set(0);
			} else {
				headerHeight.set(headerEl.offsetHeight);
			}
		} else {
			headerHeight.set(0);
		}
	}

	onMount(() => {
		// A. Media Query definieren: Touch + Querformat
		landscapeQuery = window.matchMedia('(pointer: coarse) and (orientation: landscape)');

		// B. Event Listener: Wenn man das Handy dreht, sofort updateHeaderHeight feuern
		// (Das ist schneller als der ResizeObserver)
		landscapeQuery.addEventListener('change', updateHeaderHeight);

		// C. Normaler Observer
		observer = new ResizeObserver(updateHeaderHeight);

		// Initialer Aufruf
		updateHeaderHeight();

		// Zusätzlicher Resize Listener für Desktop
		window.addEventListener('resize', updateHeaderHeight);

		return () => {
			window.removeEventListener('resize', updateHeaderHeight);
			if (landscapeQuery) landscapeQuery.removeEventListener('change', updateHeaderHeight);
			if (observer) observer.disconnect();
		};
	});

	$: if (headerEl && observer) {
		observer.disconnect();
		observer.observe(headerEl);
		updateHeaderHeight();
	}

	$: currentPath = $page.url.pathname;
</script>

<header
	bind:this={headerEl}
	class="smart-header w-full transition-all duration-700 ease-in-out pointer-events-auto"
	style:position={bannerTop ? 'absolute' : 'relative'}
	style:top="0"
	style:left="0"
	style:z-index="9999"
	style:background-color={computedBgColor}
	style:color={headerColor}
>
	<Bounded tag="div" yPadding="none" tMargin="lg">
		<div class="flex {$isMenuOpen ? '' : 'items-center'} justify-between w-full">
			<div class="logo m-0">
				{#if prismicTheme?.data?.logo?.url}
					<a href={lang === mainLang ? '/' : `/${lang}`} class="flex items-center mt-2 mb-2">
						<PrismicImage
							field={prismicTheme.data.logo}
							alt={prismicTheme.data.logo.alt}
							class="w-auto"
							style="height: {logoHeight}rem;"
						/>
					</a>
				{:else if settings?.data}
					<a href={lang === mainLang ? '/' : `/${lang}`} class="mt-6 mb-6 inline-block" style="color: {headerLinkColor};">
						<span
							class="text-xl font-semibold tracking-tight"
							style="font-size: {siteTitleFontSize}rem; font-family: {siteTitleFont};"
						>
							<PrismicText field={settings.data.site_title} /><br />
						</span>
						<span style="font-size: {siteSubtitleFontSize}rem; font-family: {siteTitleFont}">
							<PrismicText field={settings.data.site_sub_title} class="text-sm" />
						</span>
					</a>
				{/if}
			</div>

			{#if navigation && settings && prismicTheme}
				<Navbar
					{navigation}
					headerBgColor={computedBgColor}
					{headerLinkColor}
					{headerLinkFontSize}
					{headerLinkHoverColor}
					{currentPath}
					{headerHeight}
					{lang}
					{locales}
					{showSwitcher}
					allAlternates={allAlternates}
				/>
			{/if}
		</div>
	</Bounded>
</header>

<style>
	@media (orientation: landscape) and (pointer: coarse) {
		.smart-header {
			display: none !important;
		}
	}
</style>
