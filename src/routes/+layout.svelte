<script lang="ts">
	import '../app.css';
	import { onMount, afterUpdate } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { updateTheme } from '$lib/utils/themeUpdater'; // Importiere die neue Funktion
	import { theme } from '$lib/stores/theme'; // Importiere den Store, um auf seine Werte zuzugreifen
	import { getFontSize } from '$lib/utils/fontMapper'; // Importiere den Helper

	export let data;

	// Adobe Fonts URL generieren
	$: adobeFontId = data?.adobeFontId; // z.B. "lal6jiy"
	$: adobeFontUrl = adobeFontId ? `https://use.typekit.net/${adobeFontId}.css` : null;

	// Hilfsfunktion: Erzeuge Google Fonts URL aus Array von Font-Objekten
	function getGoogleFontsUrl(fontsArr: any[]): string | null {
		if (!Array.isArray(fontsArr) || !fontsArr.length) return null;
		const families = fontsArr
			.filter((f) => f?.data?.provider === 'Google' && f.data?.name)
			.map((f) => {
				// Nur Leerzeichen durch + ersetzen!
				const name = f.data.name.replace(/\s+/g, '+');
				const variants = f.data.variants ? `:${f.data.variants}` : '';
				return `family=${name}${variants}`;
			});
		if (!families.length) return null;
		return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
	}

	$: googleFontsUrl = getGoogleFontsUrl(data?.fonts);

	// Favicon bereitstellen
	onMount(() => {
		if (data.prismicTheme?.data?.favicon?.url) {
			const faviconLink =
				document.querySelector("link[rel~='icon']") || document.createElement('link');
			(faviconLink as HTMLLinkElement).rel = 'icon';
			(faviconLink as HTMLLinkElement).href = data.prismicTheme.data.favicon.url;
			document.head.appendChild(faviconLink);
		}
	});

	// Reaktive Deklaration: Diese Block wird ausgeführt, wenn sich `data` ändert.
	// Rufe die ausgelagerte Funktion auf
	$: {
		updateTheme(data);
	}

	// Zugriff auf die Store-Werte für die Styles
	$: bodyFontStyle = $theme.pageFont ? `font-family: '${$theme.pageFont}';` : '';

	// Prüfe ob die aktuelle Seite einen Titelbereich-Slice mit banner_overlap hat
	$: hasBannerOverlap = (() => {
		const slices = $page.data?.page?.data?.slices;
		if (!Array.isArray(slices)) return false;

		const titelbereichSlice = slices.find((s: any) => s.slice_type === 'hero');
		return titelbereichSlice?.primary?.banner_overlap === true;
	})();

	// Prüfe ob die aktuelle Seite als Landing Page markiert ist
	$: isLandingPage = $page.data?.page?.data?.landing_page === true;
	afterNavigate(() => {
		mounted = true;
	});

	// 1. Hole die Werte aus den Prismic Settings
	$: mobileSizeKey = data?.prismicTheme?.data?.base_font_size_mobile;
	$: desktopSizeKey = data?.prismicTheme?.data?.base_font_size_desktop;

	// 2. Wandle sie in Pixel-Werte um (z.B. "18px")
	$: cssMobileSize = getFontSize(mobileSizeKey);
	$: cssDesktopSize = getFontSize(desktopSizeKey);

	// --- NEU: Injektion via JavaScript ---
	// Wir schreiben die Variablen direkt auf das <html> Element (document.documentElement)
	$: if (typeof document !== 'undefined') {
		document.documentElement.style.setProperty('--global-size-mobile', cssMobileSize);
		document.documentElement.style.setProperty('--global-size-desktop', cssDesktopSize);
	}
</script>

<svelte:head>
	<title>{$page.data?.title || 'Default Title'}</title>
	{#if $page.data?.meta_description}
		<meta name="description" content={$page.data.meta_description} />
	{/if}
	{#if $page.data?.meta_title}
		<meta name="og:title" content={$page.data.meta_title} />
	{/if}
	{#if $page.data?.meta_image}
		<meta name="og:image" content={$page.data.meta_image.url} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#if $page.data?.no_index}
		<meta name="robots" content="noindex" />
	{/if}
	{#if adobeFontUrl}
		<link rel="stylesheet" href={adobeFontUrl} />
	{/if}
	{#if $page.data.page?.alternate_languages}
        {#each $page.data.page.alternate_languages as alt}
            <link rel="alternate" hreflang={alt.lang} href="{alt.url}" />
        {/each}
        <link rel="alternate" hreflang="x-default" href="https://deine-domain.ch/" />
    {/if}
	<link rel="stylesheet" href={googleFontsUrl || ''} data-dynamic-google-fonts="true" />
</svelte:head>
<div style="background-color: {$theme.pageBgColor};">
	{#if !isLandingPage}
		<Header
			navigation={data?.navigation || []}
			settings={data?.settings || {}}
			prismicTheme={data?.prismicTheme || {}}
			lang={data?.lang}
			locales={data?.locales}
		/>
	{/if}
	<main style={bodyFontStyle}>
		{#if $page.data?.title && !hasBannerOverlap}
			<Bounded
				as="section"
				style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};"
			>
				<h1 class="tracking-tight mt-12 mb-7 first:mt-0 last:mb-0">
					{$page.data?.title || 'Standarttitel'}
				</h1>
			</Bounded>
		{/if}
		<slot />
	</main>
	{#if !isLandingPage}
		<Footer navigation={data?.navigation || []} settings={data?.settings || {}} />
	{/if}
</div>
<PrismicPreview {repositoryName} />
