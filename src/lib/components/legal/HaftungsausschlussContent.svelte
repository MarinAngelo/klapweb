<script lang="ts">
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';

    export let data: any;

    $: lang = data?.lang || 'de-ch';
    $: settings = data?.settings;
    $: field = settings?.data?.haftungsausschluss;

    $: fallback = lang === 'en-us'
        ? [{ type: 'paragraph', text: 'Our disclaimer is currently being updated.', spans: [] }]
        : [{ type: 'paragraph', text: 'Der Haftungsausschluss wird derzeit aktualisiert.', spans: [] }];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1 class="break-words hyphens-auto">
        {lang === 'en-us' ? 'Disclaimer' : 'Haftungsausschluss'}
    </h1>

    <PrismicRichText
        field={Array.isArray(field) && field.length > 0 ? field : fallback}
    />
</main>

<style>
    .prose {
        max-width: 65ch;
    }
</style>
