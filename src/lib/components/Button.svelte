<script lang="ts">
    import { PrismicLink } from '@prismicio/svelte';
    import { theme } from '$lib/stores/theme';
    import { page } from '$app/stores';
    import { t } from '$lib/i18n/translations';

    export let link: any;
    
    // Wir initialisieren text als undefined, um den Default reaktiv zu setzen
    export let text: string | undefined = undefined;

    // Props für Farbüberschreibungen
    export let color: string | undefined;
    export let bgColor: string | undefined;
    export let hoverColor: string | undefined;
    export let hoverBgColor: string | undefined;

    // Ermittle aktuelle Sprache für den Standard-Text
    $: lang = $page.data.lang || 'de-ch';
    $: finalText = text || t('Mehr erfahren', lang);

    $: resolvedColor = color ?? $theme.pageButtonColor;
    $: resolvedBgColor = bgColor ?? $theme.pageButtonBgColor;
    $: resolvedHoverColor = hoverColor ?? $theme.pageButtonHoverColor;
    $: resolvedHoverBgColor = hoverBgColor ?? $theme.pageButtonHoverBgColor;
</script>

{#if link}
    <PrismicLink
        field={link}
        class="button-prismic-link inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6 border transition duration-200 ease-in-out focus:outline-none focus:ring-0"
        style={`
            background-color: ${resolvedBgColor};
            color: ${resolvedColor};
            border-color: ${resolvedColor};
            --hover-text-color: ${resolvedHoverColor};
            --hover-bg-color: ${resolvedHoverBgColor};
            --focus-ring-color: ${resolvedColor};
        `}
    >
        {finalText}
    </PrismicLink>
{:else}
    <button
        type="submit"
        class="button-prismic-link inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6 border transition duration-200 ease-in-out focus:outline-none focus:ring-0"
        style={`
            background-color: ${resolvedBgColor};
            color: ${resolvedColor};
            border-color: ${resolvedColor};
            --hover-text-color: ${resolvedHoverColor};
            --hover-bg-color: ${resolvedHoverBgColor};
            --focus-ring-color: ${resolvedColor};
        `}
        disabled={$$props.disabled}
        on:click
    >
        {finalText}
    </button>
{/if}