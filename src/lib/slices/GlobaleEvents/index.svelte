<script lang="ts">
    import { onMount } from 'svelte';
    import { createClient } from '$lib/prismicio';
    import { isFilled } from '@prismicio/helpers';
    import { SliceZone } from '@prismicio/svelte';
    import { components } from '$lib/slices';
    import type { Content } from '@prismicio/client';
    import { theme } from '$lib/stores/theme';
    import { page } from '$app/stores';
    import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
    import { reveal } from '$lib/actions/reveal'; // Action direkt importieren

    export let slice: Content.GlobaleEventsSlice;

    // Zentrales Mapping der Animation aus den CMS-Feldern
    $: anim = mapAnimationFromPrimary(slice.primary);

    let eventSlices: any[] = [];
    let loading = true;

    onMount(async () => {
        if (isFilled.contentRelationship(slice.primary.events)) {
            try {
                const client = createClient();
                const eventDoc = await client.getByID(slice.primary.events.id, {
                    lang: $page.data.lang
                });

                if (eventDoc?.data && 'slices' in eventDoc.data) {
                    eventSlices = eventDoc.data.slices ?? [];
                }
            } catch (error) {
                console.warn('Hinweis: Verknüpftes Event-Dokument in dieser Sprache nicht gefunden.');
            } finally {
                loading = false;
            }
        } else {
            loading = false;
        }
    });
</script>

<div
    style="color: {$theme.pageColor}"
    data-slice-type={slice.slice_type}
    data-slice-variation={slice.variation}
    use:reveal={anim.animate ? anim.options : { direction: 'none' }}
>
    {#if loading}
        <div class="flex items-center justify-center py-10">
            <span
                class="animate-spin inline-block w-5 h-5 border-2 border-t-transparent border-current rounded-full"
            ></span>
        </div>
    {:else if eventSlices.length > 0}
        <SliceZone slices={eventSlices} {components} />
    {:else if $page.url.hostname === 'localhost'}
        <div class="p-4 border border-dashed border-gray-300 text-center text-xs text-gray-400">
            [Event-Slice: Kein Content für Sprache "{$page.data.lang}" verfügbar]
        </div>
    {/if}
</div>