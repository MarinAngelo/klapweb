<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/theme';
	import { convertNumber } from '$lib/utils'; // Import der Funktion

	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;
	console.log('Layout data:', data.prismicTheme.data.body_font);

// Weise den Wert direkt der Prop bodyFont zu
    export let bodyFont: string | undefined = data.prismicTheme.data.body_font;
    export let navFont: string | undefined = data.prismicTheme.data.nav_font;
	// Fallbacks direkt
	const bannerTop = data.prismicTheme.data?.banner_top;

	// Fallbacks aus app.css verwenden
	const headerBgOpacity = convertNumber(data.prismicTheme.data?.header_bg_opacity ?? 0) || 0.5;
	const headerBgColor = data.prismicTheme.data?.header_bg_color || 'var(--header-bg-color)';
	const headerColor = data.prismicTheme.data?.header_color || 'var(header-color)';
	const headerLinkColor = data.prismicTheme.data?.header_link_color || 'var(--header-link-color)';
	const headerLinkHoverColor =
		data.prismicTheme.data?.header_link_hover_color || 'var(--header-link-hover-color)';
	const footerBgColor = data.prismicTheme.data?.footer_bg_color || 'var(--footer-bg-color)';
	const footerColor = data.prismicTheme.data?.footer_color || 'var(--footer-color)';
	const pageColor = data.prismicTheme.data?.page_color || 'var(--page-color)';
	const pageBgColor = data.prismicTheme.data?.page_bg_color || 'var(--page-bg-color)';

	// Store aktualisieren
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
		pageBgColor
	}));

    $: bodyFontStyle = `font-family: '${bodyFont || 'sans-serif'}', sans-serif;`;
	// $: navFontStyle = `font-family: '${navFont || 'sans-serif'}', sans-serif;`;
	
	// CSS-Variable aktualisieren (nur im Browser)
    $: if (browser && navFont) {
        document.documentElement.style.setProperty('--nav-font', navFont);
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
</svelte:head>
<!--Hier wird die Textfarbe zugewiesen, zuweisung Hintergrundfarbe funktioniert nicht-->
<div class="text-slate-800">
	<Header
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
	<main style={bodyFontStyle}><slot /></main>
	<Footer
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
</div>
<PrismicPreview {repositoryName} />
