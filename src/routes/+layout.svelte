<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import { PrismicPreview } from '@prismicio/svelte/kit';
    import { asText } from '@prismicio/client';

    import { repositoryName } from '$lib/prismicio';
    import { staticRoutes } from '$lib/i18n/i18n';

    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import Bounded from '$lib/components/Bounded.svelte';

    import { updateTheme } from '$lib/utils/themeUpdater';
    import { theme } from '$lib/stores/theme';
    import { getFontSize } from '$lib/utils/fontMapper';

    export let data: any;

    // 1. REAKTIVE DATEN
    $: ({ settings, navigation, prismicTheme, fonts, lang, locales, mainLang } = data);
    $: dynamicDefaultLang = mainLang || 'de-ch';
    $: showSwitcher = !!settings?.data?.show_language_switcher;

    // --- SEO & METADATEN ---
    $: siteName = settings?.data?.site_name || 'Klap Web';
    $: pageTitle = $page.data?.meta_title || $page.data?.title || settings?.data?.meta_title || siteName;
    $: finalTitle = pageTitle === siteName ? siteName : `${pageTitle} | ${siteName}`;
    $: finalDesc = $page.data?.meta_description || asText(settings?.data?.meta_description) || '';
    $: finalImage = $page.data?.meta_image || $page.data?.page?.data?.meta_image?.url || settings?.data?.meta_image?.url || '';
    $: faviconUrl = settings?.data?.favicon?.url || '/favicon.png';
    $: noIndex = $page.data?.no_index || false;

    // --- DOMAIN & URL ---
    $: rawDomain = settings?.data?.domain || 'klap-web.ch';
    $: cleanBaseUrl = (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`).replace(/\/$/, '');
    $: currentUrl = `${cleanBaseUrl}${$page.url.pathname}`;

    // --- 2. SWITCHER & ALTERNATES LOGIK (SYNCHRONISIERT) ---
    $: allAlternates = (() => {
        // Error-Pages: Nur Homepage-Links
        if ($page.status !== 200) {
            return (locales || []).map((l: string) => ({
                lang: l,
                href: l === dynamicDefaultLang ? '/' : `/${l}`
            }));
        }

        const p = $page.data.page;
        const currentUid = $page.params.uid || 'home';

        // A. Prismic Dokumente mit Übersetzungen
        if (p?.alternate_languages?.length > 0) {
            return p.alternate_languages.map((alt: any) => ({
                lang: alt.lang,
                href: alt.lang === dynamicDefaultLang 
                    ? `/${alt.uid === 'home' ? '' : alt.uid}` 
                    : `/${alt.lang}/${alt.uid === 'home' ? '' : alt.uid}`
            }));
        }

        // B. Statische Routen Mapping
        const segments = $page.url.pathname.split('/').filter(Boolean);
        const currentSlug = (segments[0] === 'en-us' || segments[0] === 'de-ch') ? segments[1] : segments[0];

        for (const key in staticRoutes) {
            const mapping = staticRoutes[key];
            if (Object.values(mapping).includes(currentSlug)) {
                return (locales || []).map(l => {
                    const targetSlug = mapping[l];
                    return {
                        lang: l,
                        href: l === dynamicDefaultLang ? `/${targetSlug}` : `/${l}/${targetSlug}`
                    };
                });
            }
        }

        // C. Fallback (Gleiche UID in andere Sprache)
        if (!locales) return [];
        return locales.map((l: string) => {
            const prefix = l === dynamicDefaultLang ? '' : `/${l}`;
            const slug = currentUid === 'home' ? '' : `/${currentUid}`;
            return {
                lang: l,
                href: `${prefix}${slug}`
            };
        });
    })().map(item => ({ 
        ...item, 
        href: item.href.replace(/\/+$/, '') || '/' 
    }));

    // --- SEO HREFLANG ---
    $: seoAlternates = allAlternates.map((alt) => ({
        lang: alt.lang,
        href: `${cleanBaseUrl}${alt.href}`
    }));

    // --- THEME & FONTS ---
    $: { updateTheme(data); }
    $: bodyFontStyle = $theme.pageFont ? `font-family: '${$theme.pageFont}';` : '';
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
            .map((f) => `family=${f.data.name.replace(/\s+/g, '+')}${f.data.variants ? ':' + f.data.variants : ''}`);
        return families.length ? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap` : null;
    })();

    $: adobeFontUrl = settings?.data?.adobe_font_id ? `https://use.typekit.net/${settings.data.adobe_font_id}.css` : null;
    $: hasBannerOverlap = $page.data?.page?.data?.slices?.find((s: any) => s.slice_type === 'hero')?.primary?.banner_overlap === true;
    $: isLandingPage = $page.data?.page?.data?.landing_page === true;

    onMount(() => {});
    afterNavigate(() => {});
</script>

<svelte:head>
    <title>{finalTitle}</title>
    <meta name="description" content={finalDesc} />
    <link rel="icon" href={faviconUrl} />
    <link rel="canonical" href={currentUrl} />

    {#if noIndex}<meta name="robots" content="noindex, nofollow" />{/if}

    {#each seoAlternates as alt}
        <link rel="alternate" hreflang={alt.lang} href={alt.href} />
    {/each}
    {#if seoAlternates.length > 0}
        <link rel="alternate" hreflang="x-default" href={cleanBaseUrl + (allAlternates.find((a) => a.lang === dynamicDefaultLang)?.href || '/')} />
    {/if}

    <meta property="og:title" content={finalTitle} />
    <meta property="og:description" content={finalDesc} />
    <meta property="og:image" content={finalImage} />
    <meta property="og:url" content={currentUrl} />
    <meta property="og:type" content="website" />

    {#if googleFontsUrl}<link rel="stylesheet" href={googleFontsUrl} />{/if}
    {#if adobeFontUrl}<link rel="stylesheet" href={adobeFontUrl} />{/if}
</svelte:head>

<div style="background-color: {$theme.pageBgColor};">
    {#if !isLandingPage}
        <Header {navigation} {settings} {prismicTheme} {lang} {locales} {allAlternates} {showSwitcher} />
    {/if}
    <main style={bodyFontStyle}>
        {#if $page.data?.title && !hasBannerOverlap}
            <Bounded as="section" style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};">
                <h1 class="tracking-tight mt-12 mb-7 first:mt-0 last:mb-0">
                    {$page.data?.title}
                </h1>
            </Bounded>
        {/if}
        {#key $page.url.pathname}
            <slot />
        {/key}
    </main>
    {#if !isLandingPage}
        <Footer {navigation} {settings} {lang} />
    {/if}
</div>
<PrismicPreview {repositoryName} />