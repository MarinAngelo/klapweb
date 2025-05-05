<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { convertNumber } from '$lib/utils'; // Import der Funktion

	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';

	export let data;

	// Weise den Wert direkt der Prop bodyFont zu
	export let bodyFont: string | undefined = data.prismicTheme.data.body_font;
	// export let footerColor: string | undefined = data.prismicTheme.data?.footer_color || 'var(--footer-color)';
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
	const pageLinkColor = data.prismicTheme.data?.page_link_color || 'var(--page-link-color)';
	const pageLinkHoverColor = data.prismicTheme.data?.page_link_hover_color || 'var(--page-link-hover-color)';
	const pageLinkActiveColor = data.prismicTheme.data?.page_link_active_color || 'var(--page-link-active-color)';
	const pageLinkVisitedColor = data.prismicTheme.data?.page_link_visited_color || 'var(--page-link-visited-color)';
	const navFont = data.prismicTheme.data?.nav_font || 'var(--nav-font)';

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
		pageBgColor,
		pageLinkColor,
		pageLinkHoverColor,
		pageLinkActiveColor,
		pageLinkVisitedColor,
		navFont
	}));

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
	<Footer
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
</div>
<PrismicPreview {repositoryName} />
