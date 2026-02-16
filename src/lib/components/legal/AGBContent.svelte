<script lang="ts">
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';

    export let data: any;

    // Sprache ermitteln
    $: lang = data?.lang || 'de-ch';
    $: settings = data?.settings;
    $: agbField = settings?.data?.agb;

    // Optionaler Fallback, falls in Prismic noch nichts steht
    $: fallback = lang === 'en-us' 
        ? [{ type: 'paragraph', text: 'Our Terms and Conditions are currently being updated for the English version. Please contact us for further information.', spans: [] }]
        : [{ type: 'paragraph', text: 'Unsere Allgemeinen Geschäftsbedingungen werden derzeit aktualisiert.', spans: [] }];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1 class="break-words hyphens-auto">
        {lang === 'en-us' ? 'Terms and Conditions' : 'Allgemeine Geschäftsbedingungen (AGB)'}
    </h1>

    <PrismicRichText 
        field={Array.isArray(agbField) && agbField.length > 0 ? agbField : fallback} 
    />
</main>

<style>
    .prose {
        max-width: 65ch;
    }
</style>