<script lang="ts">
    import { page } from '$app/stores';
    import { theme } from '$lib/stores/theme';
    import { headerHeight } from '$lib/stores/headerHeight';
    import type { Content, PrismicDocument } from '@prismicio/client';
    import clsx from 'clsx';
    import { onMount } from 'svelte';
    import { isMenuOpen } from '$lib/stores/isMenuOpen';
    import { PrismicImage, PrismicText } from '@prismicio/svelte';
    import { hexToRgba } from '$lib/utils/color';
    import Bounded from './Bounded.svelte';
    import Navbar from './Navbar.svelte';

    export let settings: Content.SettingsDocument | undefined;
    export let navigation: Content.NavigationDocument | undefined;
    export let prismicTheme: PrismicDocument | undefined;

    // --- STATE ---
    let headerEl: HTMLElement | undefined;
    let observer: ResizeObserver;

    // --- STANDARDWERTE ---
    const logoHeight = prismicTheme?.data?.logo_height || 3;
    const siteTitleFontSize = settings?.data?.site_title_font_size || 1.5;
    const siteSubtitleFontSize = settings?.data?.site_sub_title_font_size || 1;
    const headerfontSize = prismicTheme?.data?.header_font_size || 1.4;

    function updateHeaderHeight() {
        if (headerEl) {
            // Wir prüfen, ob der Header durch CSS ausgeblendet wurde (offsetParent ist null bei display: none)
            if (headerEl.offsetParent === null) {
                headerHeight.set(0);
            } else {
                headerHeight.set(headerEl.offsetHeight);
            }
        } else {
            headerHeight.set(0);
        }
    }

    onMount(() => {
        // Observer kümmert sich um Änderungen (auch wenn CSS den Header ausblendet)
        observer = new ResizeObserver(updateHeaderHeight);
        
        // Initial einmal messen
        updateHeaderHeight();

        // Ein zusätzlicher Listener, falls sich die Orientierung ändert
        window.addEventListener('resize', updateHeaderHeight);

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            if (observer) observer.disconnect();
        };
    });

    $: if (headerEl && observer) {
        observer.disconnect();
        observer.observe(headerEl);
        updateHeaderHeight();
    }

    // --- STYLES ---
    $: bannerTop = $theme.bannerTop;
    $: headerBgColor = $theme.headerBgColor;
    $: headerBgOpacity = $theme.headerBgOpacity;
    $: headerColor = $theme.headerColor;
    $: headerLinkColor = $theme.headerLinkColor;
    $: headerLinkHoverColor = $theme.headerLinkHoverColor;
    $: currentPath = $page.url.pathname;
    
    $: computedBgColor = hexToRgba(headerBgColor, headerBgOpacity);
</script>

<header
    bind:this={headerEl}
    class="smart-header w-full transition-all duration-300 ease-in-out pointer-events-auto"
    style:position={bannerTop ? 'absolute' : 'relative'}
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
    >
        <div class="flex {$isMenuOpen ? '' : 'items-center'} justify-between w-full">
            <div class="logo m-0">
                {#if prismicTheme?.data?.logo?.url}
                    <a href="/" class="flex items-center mt-2 mb-2">
                        <PrismicImage
                            field={prismicTheme.data.logo}
                            alt={prismicTheme.data.logo.alt}
                            class="w-auto"
                            style="height: {logoHeight}rem;"
                        />
                    </a>
                {:else if settings?.data}
                    <a href="/" class="mt-6 mb-6 inline-block" style="color: {headerColor};">
                        <span
                            class="text-xl font-semibold tracking-tight"
                            style="font-size: {siteTitleFontSize}rem;"
                        >
                            <PrismicText field={settings.data.site_title} /><br />
                        </span>
                        <span style="font-size: {siteSubtitleFontSize}rem;">
                            <PrismicText field={settings.data.site_sub_title} class="text-sm" />
                        </span>
                    </a>
                {/if}
            </div>

            {#if navigation && settings && prismicTheme}
                <Navbar
                    {navigation}
                    {headerColor}
                    {headerBgColor}
                    {headerLinkColor}
                    {headerLinkHoverColor}
                    {settings}
                    {currentPath}
                    {prismicTheme}
                    {headerfontSize}
                    {headerHeight}
                />
            {/if}
        </div>
    </Bounded>
</header>

<style>
    /* DIE MAGIE:
       Dies ist reines CSS. Es wird vom Browser sofort ausgeführt.
       
       Bedingung:
       1. Ausrichtung: Querformat (landscape)
       2. Zeiger: Grob/Touch (pointer: coarse)
       
       Ergebnis: Header wird ausgeblendet (display: none).
       Desktop-Mäuse haben 'pointer: fine', daher bleibt er dort sichtbar.
    */
    @media (orientation: landscape) and (pointer: coarse) {
        .smart-header {
            display: none !important;
        }
    }
    
    /* Optional: Fallback für sehr flache Bildschirme (Handy quer), falls pointer:coarse nicht greift */
    @media (orientation: landscape) and (max-height: 500px) {
        .smart-header {
            display: none !important;
        }
    }
</style>