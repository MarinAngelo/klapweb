<script lang="ts">
    import type { Content } from '@prismicio/client';
    import Bounded from '$lib/components/Bounded.svelte';
    import { theme } from '$lib/stores/theme';
    import { get } from 'svelte/store';

    export let slice: Content.HtmlCodeSlice;

    const htmlCode = (slice.primary.html_code?.[0] as { text: string })?.text || '';

    function replaceHtmlTags(html: string) {
        return html.replace(/<script.*?<\/script>/g, '');
    }

    const sanitizedHtmlCode = replaceHtmlTags(htmlCode);

    const themePageColor = get(theme).pageColor;
</script>

<Bounded tag="section" data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
    <div class="html-code-container" style="--hr-color: {themePageColor};"> 
        {@html sanitizedHtmlCode}
    </div>
</Bounded>

<style>
    /* Verwende :global(), um das hr innerhalb des Containers anzusprechen */
    /* und nutze height/background-color für ein modernes Styling */
    :global(.html-code-container hr) {
        border: none; /* Standard-Browser-Rahmen entfernen */
        height: 1px; /* Dicke der Linie über Höhe steuern */
        background-color: var(--hr-color); /* Farbe der Linie (oder {get(theme).pageColor}) */
        color: transparent; /* Verhindert ggf. Darstellung durch Browser-Theme-Farbe */
    }
</style>