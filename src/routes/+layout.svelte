<script lang="ts">
	import '../app.css';
	import { onMount, afterUpdate } from 'svelte';
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/stores';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import { updateTheme } from '$lib/utils/themeUpdater'; // Importiere die neue Funktion
	import { theme } from '$lib/stores/theme'; // Importiere den Store, um auf seine Werte zuzugreifen

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
	$: bodyFontStyle = `font-family: '${$theme.bodyFont || 'sans-serif'}', sans-serif;`;

	$: bannerTop = $theme.bannerTop;

	// ✅ NEU: Client-Side Guard
	let mounted = false;
	onMount(() => {
		mounted = true;
	});
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
	<link rel="stylesheet" href={googleFontsUrl || ''} data-dynamic-google-fonts="true" />
</svelte:head>
<div style="background-color: {$theme.pageBgColor};">
	<Header
		navigation={data?.navigation || []}
		settings={data?.settings || {}}
		prismicTheme={data?.prismicTheme || {}}
	/>
	<main style={bodyFontStyle}>
		{#if $page.data?.title && bannerTop === false}
			<div class:hidden={!mounted}>
				<Bounded
					as="section"
					style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};"
				>
					<h1 class="tracking-tight mt-12 mb-7 first:mt-0 last:mb-0">
						{$page.data?.title || 'Standarttitel'}
					</h1>
				</Bounded>
			</div>
		{/if}
		<slot />
	</main>
	<Footer navigation={data?.navigation || []} settings={data?.settings || {}} />
</div>
<PrismicPreview {repositoryName} />
