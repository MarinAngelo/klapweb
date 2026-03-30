<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import type { Content, PrismicDocument } from '@prismicio/client';
	import { onMount } from 'svelte';
	import { isMenuOpen } from '$lib/stores/isMenuOpen';
	import { isLightboxOpen } from '$lib/stores/isLightboxOpen';
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

	// --- STATE ---
	let headerEl: HTMLElement | undefined;
	let observer: ResizeObserver;
	let landscapeQuery: MediaQueryList; // Neu: Listener für Landscape
	let revealRafId: number;
	let bgFadeRafId: number;

	function handleRevealScroll() {
		cancelAnimationFrame(revealRafId);
		revealRafId = requestAnimationFrame(() => {
			if (!headerEl) return;
			headerEl.style.transition = 'opacity 1.2s ease';
			headerEl.style.opacity = '1';
		});
	}

	function handleBgFadeScroll() {
		cancelAnimationFrame(bgFadeRafId);
		bgFadeRafId = requestAnimationFrame(() => {
			if (!headerEl || $isMenuOpen) return;
			const heroEl = document.querySelector(
				'[data-slice-type="hero"], [data-slice-type="p5_grafik"]'
			) as HTMLElement | null;
			const scrollY = window.scrollY;
			const delay = window.innerHeight * 0.5;
			let opacity: number;
			if (scrollY < delay) {
				opacity = headerBgOpacity;
			} else {
				const heroBottom = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : window.innerHeight;
				const progress = Math.max(0, Math.min(1, (scrollY - delay) / (heroBottom - delay)));
				opacity = headerBgOpacity + (1 - headerBgOpacity) * progress;
			}
			const bg = hexToRgba(headerBgColor, opacity);
			headerEl.style.setProperty('--navbar-current-bg', bg);
			if (stickyHeader) {
				headerEl.style.backgroundColor = bg;
			}
		});
	}

	// --- STANDARDWERTE ---
	$: logoHeight = prismicTheme?.data?.logo_height || $theme.logoHeight;
	$: logoColor = prismicTheme?.data?.logo_color || null;
	$: isSvgLogo = !!prismicTheme?.data?.logo?.url?.toLowerCase().includes('.svg');
	$: siteTitleFontSize = prismicTheme?.data?.site_title_font_size || $theme.siteTitleFontSize;
	$: siteTitleFont = prismicTheme?.data?.site_title_font?.data?.name || $theme.siteTitleFont;
	$: siteSubtitleFontSize =
		prismicTheme?.data?.site_sub_title_font_size || $theme.siteSubtitleFontSize;
	$: headerLinkFontSize = prismicTheme?.data?.header_link_font_size || $theme.headerLinkFontSize;
	$: headerLinkColor = prismicTheme?.data?.header_link_color || $theme.headerLinkColor;
	$: headerLinkHoverColor =
		prismicTheme?.data?.header_link_hover_color || $theme.headerLinkHoverColor;

	// bannerTop direkt aus den Seitendaten lesen, nicht aus dem Store
	// Alle Slice-Typen berücksichtigen, die als Vollbild-Banner fungieren können
	$: bannerTop = (() => {
		const slices = $page.data?.page?.data?.slices;
		if (!Array.isArray(slices)) return false;

		const bannerSlice = slices.find(
			(s: any) =>
				(s.slice_type === 'hero' ||
					s.slice_type === 'galerie' ||
					(s.slice_type === 'p5_grafik' && s.variation === 'mitTitelbereich')) &&
				s.primary?.banner_overlap === true
		);
		return !!bannerSlice;
	})();

	$: headerColor = $theme.headerColor;

	$: headerBgColor = prismicTheme?.data?.header_bg_color || $theme.headerBgColor;
	// headerBgOpacity wird nur aus dem Titelbereich-Slice gesetzt, nicht aus prismicTheme
	$: headerBgOpacity = $theme.headerBgOpacity;
	// Wechsle zwischen transparent und fester Farbe basierend auf Menü-Status
	$: computedBgColor = $isMenuOpen ? headerBgColor : hexToRgba(headerBgColor, headerBgOpacity);
	$: if (headerEl) headerEl.style.setProperty('--navbar-current-bg', computedBgColor);

	function updateHeaderHeight() {
		// 1. ZUERST PRÜFEN: Mobile Landscape?
		// Wenn ja -> Sofort 0 zurückgeben und abbrechen.
		if (landscapeQuery && landscapeQuery.matches) {
			headerHeight.set(0);
			return;
		}

		// 2. Ansonsten: Messen (offsetHeight = 0 bei display:none, klappt auch bei position:fixed)
		headerHeight.set(headerEl ? headerEl.offsetHeight : 0);
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

		// Hintergrund-Opacity beim Scrollen einblenden (nur sticky)
		window.addEventListener('scroll', handleBgFadeScroll, { passive: true });

		// Kopfzeile beim Laden ausblenden, erst beim Scrollen einblenden
		if (hideHeaderOnLoad && headerEl) {
			// transition-all sofort deaktivieren, damit opacity snap ohne Animation
			headerEl.style.transition = 'none';
			headerEl.style.opacity = '0';
			requestAnimationFrame(() => {
				if (headerEl) headerEl.style.transition = '';
			});
			window.addEventListener('scroll', handleRevealScroll, { passive: true, once: true });
		}

		return () => {
			window.removeEventListener('resize', updateHeaderHeight);
			if (landscapeQuery) landscapeQuery.removeEventListener('change', updateHeaderHeight);
			if (observer) observer.disconnect();
			headerHeight.set(0);
			window.removeEventListener('scroll', handleRevealScroll);
			window.removeEventListener('scroll', handleBgFadeScroll);
			cancelAnimationFrame(revealRafId);
			cancelAnimationFrame(bgFadeRafId);
		};
	});

	$: if (headerEl && observer) {
		observer.disconnect();
		observer.observe(headerEl);
		updateHeaderHeight();
	}

	$: currentPath = $page.url.pathname;
	$: hideHeaderOnLoad = $theme.hideHeaderOnLoad;
	$: stickyHeader = prismicTheme?.data?.sticky_header ?? false;
</script>

<header
	bind:this={headerEl}
	class="smart-header w-full transition-all duration-700 ease-in-out pointer-events-auto"
	class:opacity-0={$isLightboxOpen}
	class:pointer-events-none={$isLightboxOpen}
	style:position={stickyHeader ? 'fixed' : bannerTop ? 'absolute' : 'relative'}
	style:top="0"
	style:left="0"
	style:z-index="9999"
	style:background-color={computedBgColor}
	style:color={headerColor}
>
	<Bounded
		tag="div"
		yPadding="none"
		tMargin="lg"
		fullWidth={prismicTheme?.data?.full_screen_width === true}
	>
		<div class="flex items-stretch justify-between w-full">
			<div class="logo m-0 flex items-center">
				{#if prismicTheme?.data?.logo?.url}
					<a href={lang === mainLang ? '/' : `/${lang}`} class="flex items-center mt-5 mb-5">
						{#if isSvgLogo && logoColor}
							{@const dims = prismicTheme.data.logo.dimensions}
							<div
								style="height: {logoHeight}rem; {dims
									? `aspect-ratio: ${dims.width} / ${dims.height};`
									: 'width: auto;'} background-color: {logoColor}; -webkit-mask-image: url('{prismicTheme
									.data.logo.url}'); mask-image: url('{prismicTheme.data.logo
									.url}'); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center left; mask-position: center left;"
							></div>
						{:else}
							<PrismicImage
								field={prismicTheme.data.logo}
								alt={prismicTheme.data.logo.alt}
								class="w-auto"
								style="height: {logoHeight}rem;"
							/>
						{/if}
					</a>
				{:else if settings?.data}
					<a
						href={lang === mainLang ? '/' : `/${lang}`}
						class="mt-6 mb-6 inline-block"
						style="color: {headerColor};"
					>
						<span
							class="text-xl font-semibold tracking-tight site-title-text"
							style="font-size: {siteTitleFontSize}rem; font-family: {siteTitleFont
								? siteTitleFont
								: 'var(--page-font), sans-serif'};"
						>
							<PrismicText field={settings.data.site_title} /><br />
						</span>
						<span
							class="site-title-text"
							style="font-size: {siteSubtitleFontSize}rem; font-family: {siteTitleFont
								? siteTitleFont
								: 'var(--page-font), sans-serif'};"
						>
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
					{allAlternates}
					headerLinkFont={prismicTheme?.data?.header_link_font?.data?.name || $theme.headerLinkFont}
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
