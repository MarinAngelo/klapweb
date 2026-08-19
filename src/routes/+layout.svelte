<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { building } from '$app/environment';
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { asText } from '@prismicio/client';

	import { repositoryName } from '$lib/prismicio';
	import { staticRoutes, getLangBase } from '$lib/i18n/i18n'; // getLangBase importiert

	import Header from '$lib/components/Header.svelte';
	import ChatWidget from '$lib/components/ChatWidget.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import KlapStudio from '$lib/components/KlapStudio.svelte';

	import CrosshairDevTool from '$lib/components/CrosshairDevTool.svelte';

	import { updateTheme } from '$lib/utils/themeUpdater';
	import { theme } from '$lib/stores/theme';
	import { headerHeight } from '$lib/stores/headerHeight';
	import { variables } from '$lib/stores/variables';
	import { currencySelection } from '$lib/stores/currency';
	import { addonRows } from '$lib/stores/addonRows';
	import { getFontSize } from '$lib/utils/fontMapper';
	import { reveal } from '$lib/actions/reveal';
	import { parseCurrencyCode } from '$lib/pricing';
	import { showCrosshair } from '$lib/stores/showCrosshair';
	import { errorPageLanding } from '$lib/stores/errorPageLanding';

	const titleFadeIn = { direction: 'up' as const, distance: '0px', duration: 2000, delay: 200 };
	const titleNoAnim = { direction: 'none' as const };
	$: titleAnimation = prismicTheme?.data?.heading_animation === false ? titleNoAnim : titleFadeIn;

	export let data: any;

	// 1. REAKTIVE DATEN
	$: ({
		settings,
		navigation,
		prismicTheme,
		fonts,
		lang,
		locales,
		mainLang,
		userBackendActive,
		chatActive,
		chatBotName,
		chatGreeting,
		user
	} = data);
	$: dynamicDefaultLang = mainLang || 'de-de';
	$: showSwitcher = !!settings?.data?.show_language_switcher;
	$: if (typeof document !== 'undefined' && lang) document.documentElement.lang = lang;

	// --- SEO & METADATEN ---
	$: siteName = settings?.data?.site_name || asText(settings?.data?.site_title) || '';
	$: pageTitle =
		$page.data?.meta_title || $page.data?.title || settings?.data?.meta_title || siteName;
	$: finalTitle = pageTitle === siteName ? siteName : `${pageTitle} | ${siteName}`;
	$: finalDesc = $page.data?.meta_description || asText(settings?.data?.meta_description) || '';
	$: finalImage =
		$page.data?.meta_image ||
		$page.data?.page?.data?.meta_image?.url ||
		settings?.data?.meta_image?.url ||
		'';
	$: faviconUrl = settings?.data?.favicon?.url || '/favicon.png';
	$: appleTouchIconUrl =
		settings?.data?.app_icon?.['180']?.url || settings?.data?.app_icon?.url || null;
	$: pwaThemeColor = settings?.data?.pwa_theme_color || null;
	$: noIndex = $page.data?.no_index || false;

	// --- DOMAIN & URL ---
	$: rawDomain = settings?.data?.domain || 'klap-web.ch';
	$: cleanBaseUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(
		/\/$/,
		''
	);
	$: currentUrl = `${cleanBaseUrl}${$page.url.pathname}`;

	// --- 2. SWITCHER & ALTERNATES LOGIK (KORRIGIERT) ---
	$: allAlternates = (() => {
		// Fallback für Error Pages
		if ($page.status !== 200) {
			return (locales || []).map((l: string) => ({
				lang: l,
				href: l === dynamicDefaultLang ? '/' : `/${l}`
			}));
		}

		const p = $page.data.page;
		const segments = $page.url.pathname.split('/').filter(Boolean);
		const isLangSegment = locales?.includes(segments[0]);
		const currentSlug = isLangSegment ? segments[1] : segments[0];

		// A. Statische Routen Mapping (Fix für /undefined)
		for (const key in staticRoutes) {
			const mapping = staticRoutes[key];
			if (Object.values(mapping).includes(currentSlug)) {
				return (locales || []).map((l) => {
					const base = getLangBase(l); // Nutzt 'de' oder 'en'
					const targetSlug = mapping[base];

					const prefix = l === dynamicDefaultLang ? '' : `/${l}`;
					return {
						lang: l,
						href: `${prefix}/${targetSlug}`
					};
				});
			}
		}

		// B. Prismic Dokumente mit Übersetzungen
		if (p?.alternate_languages?.length > 0) {
			return p.alternate_languages.map((alt: any) => ({
				lang: alt.lang,
				href:
					alt.lang === dynamicDefaultLang
						? `/${alt.uid === 'home' ? '' : alt.uid}`
						: `/${alt.lang}/${alt.uid === 'home' ? '' : alt.uid}`
			}));
		}

		// C. Fallback (Gleiche UID/Segment in andere Sprache)
		return (locales || []).map((l: string) => {
			const prefix = l === dynamicDefaultLang ? '' : `/${l}`;
			const currentUid = $page.params.uid || currentSlug || 'home';
			const slug = currentUid === 'home' ? '' : `/${currentUid}`;
			return {
				lang: l,
				href: `${prefix}${slug}`
			};
		});
	})().map((item) => ({
		...item,
		href: item.href.replace(/\/+$/, '') || '/'
	}));

	// --- SEO HREFLANG ---
	$: seoAlternates = allAlternates.map((alt) => ({
		lang: alt.lang,
		href: `${cleanBaseUrl}${alt.href}`
	}));

	// --- VARIABLES / TOKEN MAP ---
	// Nur updaten wenn sich der Inhalt wirklich geändert hat (verhindert Re-Render-Kaskade).
	// Nach dem ersten Geo-Override wird dieser bei späteren Änderungen ebenfalls neu angewendet.
	// Page-level tokens injected from E-Commerce fields:
	//   {{Preis}}            – base price
	//   {{Rabatt}}           – discount %
	//   {{Anzahlung}}        – deposit %
	//   {{PreisRabatt}}      – Preis × (1 − Rabatt/100)
	//   {{AnzahlungBetrag}}  – PreisRabatt × Anzahlung/100
	//   {{Restbetrag}}       – PreisRabatt − AnzahlungBetrag
	let _prevVarsStr = '{}';
	$: {
		const base = data.variables ?? {};
		const pd = $page.data?.page?.data ?? {};
		const price: number | null = pd.ecommerce_price_chf ?? null;
		const discountPct: number | null = pd.ecommerce_discount_percent ?? null;
		const globalDepositPct: number | null =
			(data.settings?.data as any)?.global_deposit_percent ?? null;
		const depositPct: number | null = pd.ecommerce_deposit_percent ?? globalDepositPct;
		const billingType: string | null = pd.ecommerce_billing_type ?? null;

		// Currency: use selected override if set, otherwise base currency from settings
		const baseCurrency =
			parseCurrencyCode((data.settings?.data as any)?.invoice_currency as string) || 'CHF';
		const sel = $currencySelection;
		const activeCurrency = sel?.code ?? baseCurrency;
		const rate = sel && sel.code !== baseCurrency ? (sel.rates[sel.code] ?? 1) : 1;
		function fmt(n: number) {
			return new Intl.NumberFormat('de-CH', { style: 'currency', currency: activeCurrency }).format(
				n * rate
			);
		}

		const pageTokens: Record<string, string> = {};
		if (billingType) {
			pageTokens['Abrechnungsart'] = billingType;
		}
		if (price != null) {
			pageTokens['Preis'] = fmt(price);
			const priceAfterDiscount = discountPct != null ? price * (1 - discountPct / 100) : price;
			if (discountPct != null) {
				pageTokens['Rabatt'] = String(discountPct);
				pageTokens['PreisRabatt'] = fmt(priceAfterDiscount);
			}
			if (depositPct != null) {
				pageTokens['Anzahlung'] = String(depositPct);
				const depositAmount = (priceAfterDiscount * depositPct) / 100;
				pageTokens['AnzahlungBetrag'] = fmt(depositAmount);
				pageTokens['Restbetrag'] = fmt(priceAfterDiscount - depositAmount);
			}
			// Total = main price + all addon prices (only injected when addons exist)
			const rawAddons: Array<{ displayAmount: number | null }> = $page.data?.addonRows ?? [];
			if (rawAddons.length > 0) {
				const addonSum = rawAddons.reduce((s, a) => s + (a.displayAmount ?? 0), 0);
				pageTokens['Total'] = fmt(priceAfterDiscount + addonSum);
			}
		}

		const v = Object.keys(pageTokens).length > 0 ? { ...base, ...pageTokens } : base;
		const s = JSON.stringify(v);
		if (s !== _prevVarsStr) {
			_prevVarsStr = s;
			variables.set(v);
		}
	}

	// Addon rows for Preisaufstellung slice — populated from page server data
	$: {
		const raw: Array<{ label: string; displayAmount: number | null; billingType: string | null }> =
			$page.data?.addonRows ?? [];
		const sel = $currencySelection;
		const baseCurrency =
			parseCurrencyCode((data.settings?.data as any)?.invoice_currency as string) || 'CHF';
		const activeCurrency = sel?.code ?? baseCurrency;
		const rate = sel && sel.code !== baseCurrency ? (sel.rates[sel.code] ?? 1) : 1;
		addonRows.set(
			raw
				.filter((a) => a.displayAmount != null)
				.map((a) => ({
					label: a.label,
					price: new Intl.NumberFormat('de-CH', {
						style: 'currency',
						currency: activeCurrency
					}).format((a.displayAmount as number) * rate),
					billingType: a.billingType
				}))
		);
	}

	// --- THEME & FONTS ---
	// Sofort synchron ausführen (verhindert Flash beim ersten Render)
	updateTheme(data);
	// Reaktiv bei Datenänderungen (z.B. Seitennavigation)
	$: {
		updateTheme(data);
	}
	// Page-level Farbüberschreibung: überschreibt globale Theme-Farben pro Seite
	// Läuft bei jeder Navigation ($page.data ändert sich immer).
	// Ohne Override: globale Farben explizit zurücksetzen (layout `data` ändert
	// sich bei Client-Navigation nicht zwingend, daher kein Verlassen auf Block 1).
	$: {
		const pd = $page.data?.page?.data ?? {};
		const overrideBg: string | null = pd.page_bg_color ?? null;
		const overrideColor: string | null = pd.page_color ?? null;
		const overrideLinkColor: string | null = pd.page_link_color ?? null;
		if (overrideBg || overrideColor || overrideLinkColor) {
			theme.update((t) => ({
				...t,
				...(overrideBg ? { pageBgColor: overrideBg } : {}),
				...(overrideColor ? { pageColor: overrideColor } : {}),
				...(overrideLinkColor ? { pageLinkColor: overrideLinkColor } : {})
			}));
			if (typeof document !== 'undefined') {
				if (overrideBg) document.documentElement.style.setProperty('--page-bg-color', overrideBg);
				if (overrideColor)
					document.documentElement.style.setProperty('--page-color', overrideColor);
				if (overrideLinkColor)
					document.documentElement.style.setProperty('--page-link-color', overrideLinkColor);
			}
		} else {
			// Keine seiten-spezifischen Farben → globale Theme-Farben wiederherstellen.
			// Wichtig: CSS-Variablen ZUERST löschen, sonst liest updateTheme via
			// getCssVar() den alten Override-Wert zurück (zirkuläre Überschreibung).
			if (typeof document !== 'undefined') {
				document.documentElement.style.removeProperty('--page-color');
				document.documentElement.style.removeProperty('--page-bg-color');
				document.documentElement.style.removeProperty('--page-link-color');
			}
			updateTheme(data);
		}
	}
	$: pageFontName =
		prismicTheme?.data?.page_font?.data?.name ||
		fonts?.find((f: any) => f.id === prismicTheme?.data?.page_font?.id)?.data?.name ||
		$theme.pageFont ||
		'';
	$: if (typeof document !== 'undefined') {
		document.body.style.fontFamily = pageFontName ? `'${pageFontName}', sans-serif` : '';
	}
	$: cssMobileSize = getFontSize(prismicTheme?.data?.base_font_size_mobile);
	$: cssDesktopSize = getFontSize(prismicTheme?.data?.base_font_size_desktop);

	$: if (typeof document !== 'undefined') {
		document.documentElement.style.setProperty('--global-size-mobile', cssMobileSize);
		document.documentElement.style.setProperty('--global-size-desktop', cssDesktopSize);
	}

	$: pOffsetMobile = prismicTheme?.data?.p_font_offset_mobile ?? 0;
	$: pOffsetDesktop = prismicTheme?.data?.p_font_offset_desktop ?? 0;
	$: if (typeof document !== 'undefined') {
		document.documentElement.style.setProperty('--p-font-offset-mobile', `${pOffsetMobile}px`);
		document.documentElement.style.setProperty('--p-font-offset-desktop', `${pOffsetDesktop}px`);
	}

	$: googleFontsUrl = (() => {
		if (!Array.isArray(fonts)) return null;
		const families = fonts
			.filter((f) => f?.data?.provider === 'Google')
			.map(
				(f) =>
					`family=${f.data.name.replace(/\s+/g, '+')}${f.data.variants ? ':' + f.data.variants : ''}`
			);
		return families.length
			? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
			: null;
	})();

	$: adobeFontUrl = settings?.data?.adobe_font_id
		? `https://use.typekit.net/${settings.data.adobe_font_id}.css`
		: null;
	$: hasBannerOverlap = $page.data?.page?.data?.slices?.some(
		(s: any) =>
			(s.slice_type === 'hero' ||
				s.slice_type === 'galerie' ||
				(s.slice_type === 'p5_grafik' && s.variation === 'mitTitelbereich')) &&
			s.primary?.banner_overlap === true
	);
	$: isLandingPage = $page.data?.page?.data?.landing_page === true || $errorPageLanding;
	$: isPreview = $page.url.pathname.startsWith('/preview/');
	$: isDokuPage = $page.url.pathname.startsWith('/doku');
	$: isNoChrome = !building && $page.url.searchParams.get('no_chrome') === 'true';
	$: stickyHeader =
		!isLandingPage &&
		!isPreview &&
		!isDokuPage &&
		!isNoChrome &&
		(prismicTheme?.data?.sticky_header ?? false);

	let studioOpen = false;

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
	});

	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.ctrlKey && e.shiftKey && e.key === 'K') {
				e.preventDefault();
				studioOpen = !studioOpen;
			}
			if (studioOpen && e.key === 'Escape') {
				e.preventDefault();
				studioOpen = false;
			}
			if (e.altKey && e.shiftKey && e.key === 'A') {
				e.preventDefault();
				goto('/admin');
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});
	afterNavigate(() => {
		currencySelection.set(null);
	});
</script>

<svelte:head>
	<title>{finalTitle}</title>
	<meta name="description" content={finalDesc} />
	<link rel="icon" href={faviconUrl} />
	{#if appleTouchIconUrl}<link rel="apple-touch-icon" href={appleTouchIconUrl} />{/if}
	<link rel="manifest" href="/manifest.webmanifest" />
	{#if pwaThemeColor}<meta name="theme-color" content={pwaThemeColor} />{/if}
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<link rel="canonical" href={currentUrl} />

	{#if noIndex}<meta name="robots" content="noindex, nofollow" />{/if}

	{#if showSwitcher}
		{#each seoAlternates as alt}
			<link rel="alternate" hreflang={alt.lang} href={alt.href} />
		{/each}
		{#if seoAlternates.length > 0}
			<link
				rel="alternate"
				hreflang="x-default"
				href={cleanBaseUrl +
					(allAlternates.find((a) => a.lang === dynamicDefaultLang)?.href || '/')}
			/>
		{/if}
	{/if}

	<meta property="og:title" content={finalTitle} />
	<meta property="og:description" content={finalDesc} />
	<meta property="og:image" content={finalImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content={currentUrl} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={finalTitle} />
	<meta name="twitter:description" content={finalDesc} />
	<meta name="twitter:image" content={finalImage} />

	{#if googleFontsUrl}<link rel="stylesheet" href={googleFontsUrl} />{/if}
	{#if adobeFontUrl}
		<link rel="preconnect" href="https://p.typekit.net" crossorigin />
		<link rel="dns-prefetch" href="https://p.typekit.net" />
	{/if}
</svelte:head>

{#if adobeFontUrl}
	<script>
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = `${adobeFontUrl}`;
		link.crossOrigin = 'anonymous';
		link.onerror = () => console.warn('Typekit CSS failed to load, using fallback fonts');
		document.head.appendChild(link);
	</script>
{/if}

<a href="#main-content" class="skip-link">Zum Inhalt springen</a>

<div style="background-color: var(--page-bg-color); min-height: 100vh;">
	{#if !isLandingPage && !isPreview && !isDokuPage && !isNoChrome}
		<Header
			{navigation}
			{settings}
			{prismicTheme}
			{lang}
			{locales}
			{allAlternates}
			{showSwitcher}
			mainLang={data.mainLang}
			{userBackendActive}
			{user}
		/>
	{/if}

	<main
		id="main-content"
		style={stickyHeader && !hasBannerOverlap ? `padding-top: ${$headerHeight}px` : ''}
		class={isLandingPage ? 'pb-24' : ''}
	>
		{#if $page.data?.title && !hasBannerOverlap && !isDokuPage}
			<Bounded
				as="section"
				style="background-color: var(--page-bg-color); color: var(--page-color);"
			>
				<!--Seiten Titel Page Title-->
				<h1 use:reveal={titleAnimation} class="tracking-tight mt-12 mb-4 first:mt-0">
					{$page.data?.title}
				</h1>
			</Bounded>
		{/if}

		{#key $page.url.pathname}
			<slot />
		{/key}
	</main>

	{#if !isLandingPage && !isPreview && !isDokuPage && !isNoChrome}
		<Footer {navigation} {settings} {lang} mainLang={data.mainLang} />
	{/if}
</div>

<PrismicPreview {repositoryName} />
<KlapStudio bind:open={studioOpen} />
{#if chatActive}
	<ChatWidget botName={chatBotName} greeting={chatGreeting} />
{/if}

<!-- Dev-Overlay: Fadenkreuz für Bildschirmmitte -->
{#if process.env.NODE_ENV !== 'production'}
	<style>
		@import '$lib/components/CrosshairDevTool.css';
	</style>
	<button
		on:click={() => showCrosshair.update((v) => !v)}
		aria-label={$showCrosshair ? 'Fadenkreuz ausblenden' : 'Fadenkreuz einblenden'}
		style="position:fixed;top:8px;right:8px;z-index:1000001;width:28px;height:28px;padding:0;background:#fff;border:1px solid #ccc;border-radius:50%;box-shadow:0 2px 8px #0001;font-size:18px;line-height:26px;cursor:pointer;opacity:0.7;display:flex;align-items:center;justify-content:center;"
	>
		+
	</button>
	<CrosshairDevTool />
{/if}
