<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import { convertNumber } from '$lib/utils';
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';

	export let data;

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

	// Initialisiere die Variablen. Die Werte werden im reaktiven Block gesetzt.
	let bodyFont: string | undefined;
	let bannerTop: boolean;
	let headerBgOpacity: number;
	let headerBgColor: string;
	let headerColor: string;
	let headerLinkColor: string;
	let headerLinkHoverColor: string;
	let footerBgColor: string;
	let footerColor: string;
	let pageColor: string;
	let pageBgColor: string;
	let pageLinkColor: string;
	let pageLinkHoverColorBg: string;
	let pageLinkHoverColorText: string;
	let pageLinkActiveColor: string;
	let pageLinkVisitedColor: string;
	let navFont: string;

	// Funktion zum Auslesen einer CSS-Variable
	// Stellt sicher, dass dies nur im Browser ausgeführt wird (für SSR wichtig)
	const getCssVar = (name: string): string => {
		if (typeof window !== 'undefined' && document.documentElement) {
			return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
		}
		return ''; // Fallback für SSR (Server-Side Rendering)
	};

	// Reaktive Deklaration: Diese Block wird ausgeführt, wenn sich `data` ändert.
	$: {
		// Zuweisung von Werten aus Prismic-Daten, mit Fallback auf CSS-Variablen
		bodyFont = data.prismicTheme.data.body_font;
		bannerTop = data.prismicTheme.data?.banner_top ?? false; // Standardwert für boolean

		headerBgOpacity = convertNumber(data.prismicTheme.data?.header_bg_opacity ?? 99) || 0.99;
		headerBgColor = data.prismicTheme.data?.header_bg_color || getCssVar('--header-bg-color');
		headerColor = data.prismicTheme.data?.header_color || getCssVar('--header-color');
		headerLinkColor = data.prismicTheme.data?.header_link_color || getCssVar('--header-link-color');
		headerLinkHoverColor =
			data.prismicTheme.data?.header_link_hover_color || getCssVar('--header-link-hover-color');

		// Diese Variablen wurden in der ursprünglichen Anfrage nicht aus Prismic bezogen,
		// daher fallen sie direkt auf die CSS-Variablen zurück.
		// Wenn sie in Prismic existieren, passe die Zuweisung entsprechend an.
		pageLinkActiveColor =
			data.prismicTheme.data?.page_link_active_color || getCssVar('--page-link-active-color');
		pageLinkVisitedColor =
			data.prismicTheme.data?.page_link_visited_color || getCssVar('--page-link-visited-color');

		footerBgColor = data.prismicTheme.data?.footer_bg_color || getCssVar('--footer-bg-color');
		footerColor = data.prismicTheme.data?.footer_color || getCssVar('--footer-color');
		pageColor = data.prismicTheme.data?.page_color || getCssVar('--page-color');
		pageBgColor = data.prismicTheme.data?.page_bg_color || getCssVar('--page-bg-color');
		pageLinkColor = data.prismicTheme.data?.page_link_color || getCssVar('--page-link-color');
		pageLinkHoverColorBg =
			data.prismicTheme.data?.page_link_hover_color_bg || getCssVar('--page-link-hover-color-bg');
		pageLinkHoverColorText =
			data.prismicTheme.data?.page_link_hover_color_text ||
			getCssVar('--page-link-hover-color-text');
		navFont = data.prismicTheme.data?.nav_font || getCssVar('--nav-font').replace(/'/g, '');

		// Store aktualisieren, sobald die Werte berechnet wurden
		theme.update((t) => ({
			...t,
			headerColor,
			headerBgColor,
			headerLinkColor,
			headerLinkHoverColor,
			headerBgOpacity,
			bannerTop,
			footerBgColor,
			footerColor,
			pageColor,
			pageBgColor,
			pageLinkColor,
			pageLinkHoverColorBg,
			pageLinkHoverColorText,
			pageLinkActiveColor,
			pageLinkVisitedColor,
			navFont
		}));
	}

	// Reaktive Deklaration für bodyFontStyle (verwendet die `bodyFont` Variable)
	$: bodyFontStyle = `font-family: '${bodyFont || 'sans-serif'}', sans-serif;`;
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
</svelte:head>
<!--Hier wird die Textfarbe zugewiesen, zuweisung Hintergrundfarbe funktioniert nicht-->
<div style="background-color: {pageBgColor};">
	<Header
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
	<main style={bodyFontStyle}>
		<!-- Seiten Titel -->
		{#if $page.url.pathname !== '/' && $page.data?.title}
			<Bounded as="section" style="background-color: {pageBgColor}; color: {pageColor};">
				<h1
					class="font-semibold leading-tight tracking-tight md:leading-tight text-3xl md:text-4xl mb-7 mt-12 first:mt-0 last:mb-0"
				>
					{$page.data?.title || 'Standarttitel'}
				</h1>
			</Bounded>
		{/if}
		<slot />
	</main>
	<Footer navigation={data?.navigation || []} settings={data?.settings || {}} />
</div>
<PrismicPreview {repositoryName} />
