<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { asText } from '@prismicio/client';

	import { repositoryName } from '$lib/prismicio';
	import { staticRoutes, getLangBase } from '$lib/i18n/i18n'; // getLangBase importiert

	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import KlapStudio from '$lib/components/KlapStudio.svelte';

	import { updateTheme } from '$lib/utils/themeUpdater';
	import { theme } from '$lib/stores/theme';
	import { variables } from '$lib/stores/variables';
	import { currencySelection } from '$lib/stores/currency';
	import { addonRows } from '$lib/stores/addonRows';
	import { getFontSize } from '$lib/utils/fontMapper';
	import { reveal } from '$lib/actions/reveal';
	import { parseCurrencyCode } from '$lib/pricing';

	const titleFadeIn = { direction: 'up' as const, distance: '0px', duration: 2000, delay: 200 };

	export let data: any;

	// 1. REAKTIVE DATEN
	$: ({ settings, navigation, prismicTheme, fonts, lang, locales, mainLang } = data);
	$: dynamicDefaultLang = mainLang || 'de-de';
	$: showSwitcher = !!settings?.data?.show_language_switcher;

	// --- SEO & METADATEN ---
	$: siteName = settings?.data?.site_name || '';
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
		const globalDepositPct: number | null = (data.settings?.data as any)?.global_deposit_percent ?? null;
		const depositPct: number | null = pd.ecommerce_deposit_percent ?? globalDepositPct;
		const billingType: string | null = pd.ecommerce_billing_type ?? null;

		// Currency: use selected override if set, otherwise base currency from settings
		const baseCurrency = parseCurrencyCode((data.settings?.data as any)?.invoice_currency as string) || 'CHF';
		const sel = $currencySelection;
		const activeCurrency = sel?.code ?? baseCurrency;
		const rate = sel && sel.code !== baseCurrency ? (sel.rates[sel.code] ?? 1) : 1;
		function fmt(n: number) {
			return new Intl.NumberFormat('de-CH', { style: 'currency', currency: activeCurrency }).format(n * rate);
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
	$: {
		updateTheme(data);
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
				(s.slice_type === 'p5_grafik' && s.variation === 'mitTitelbereich')) &&
			s.primary?.banner_overlap === true
	);
	$: isLandingPage = $page.data?.page?.data?.landing_page === true;

	let studioOpen = false;

	onMount(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.ctrlKey && e.shiftKey && e.key === 'K') {
				e.preventDefault();
				studioOpen = !studioOpen;
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
				href={cleanBaseUrl + (allAlternates.find((a) => a.lang === dynamicDefaultLang)?.href || '/')}
			/>
		{/if}
	{/if}

	<meta property="og:title" content={finalTitle} />
	<meta property="og:description" content={finalDesc} />
	<meta property="og:image" content={finalImage} />
	<meta property="og:url" content={currentUrl} />
	<meta property="og:type" content="website" />

	{#if googleFontsUrl}<link rel="stylesheet" href={googleFontsUrl} />{/if}
	{#if adobeFontUrl}<link rel="stylesheet" href={adobeFontUrl} />{/if}
</svelte:head>

<div style="background-color: {$theme.pageBgColor}; min-height: 100vh;">
	{#if !isLandingPage}
		<Header
			{navigation}
			{settings}
			{prismicTheme}
			{lang}
			{locales}
			{allAlternates}
			{showSwitcher}
			mainLang={data.mainLang}
		/>
	{/if}

	<main>
		{#if $page.data?.title && !hasBannerOverlap}
			<Bounded
				as="section"
				style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};"
			>
				<!--Seiten Titel Page Title-->
				<h1 use:reveal={titleFadeIn} class="tracking-tight mt-12 mb-4 first:mt-0">
					{$page.data?.title}
				</h1>
			</Bounded>
		{/if}

		{#key $page.url.pathname}
			<slot />
		{/key}
	</main>

	{#if !isLandingPage}
		<Footer {navigation} {settings} {lang} mainLang={data.mainLang} />
	{/if}
</div>

<PrismicPreview {repositoryName} />
<KlapStudio bind:open={studioOpen} />
