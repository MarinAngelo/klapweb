<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { PrismicPreview } from '@prismicio/svelte/kit';
    import { page } from '$app/stores';
    import { repositoryName } from '$lib/prismicio';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Bounded from '$lib/components/Bounded.svelte';
    import { updateTheme } from '$lib/utils/themeUpdater'; // Importiere die neue Funktion
    import { theme } from '$lib/stores/theme'; // Importiere den Store, um auf seine Werte zuzugreifen

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

    // Reaktive Deklaration: Diese Block wird ausgeführt, wenn sich `data` ändert.
    // Rufe die ausgelagerte Funktion auf
    $: {
        updateTheme(data);
    }

    // Zugriff auf die Store-Werte für die Styles
    $: bodyFontStyle = `font-family: '${$theme.bodyFont || 'sans-serif'}', sans-serif;`;
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
</svelte:head>
<div style="background-color: {$theme.pageBgColor};">
    <Header
        navigation={data?.navigation || []}
        settings={data?.settings || {}}
        prismicTheme={data?.prismicTheme || {}}
    />
    <main style={bodyFontStyle}>
        {#if $page.url.pathname !== '/' && $page.data?.title}
            <Bounded as="section" style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};">
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