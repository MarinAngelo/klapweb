    import { createClient } from '$lib/prismicio';
    import { error } from '@sveltejs/kit';

    /** @type {import('./$types').PageServerLoad} */
    export async function load({ params, parent }) {
        // 1. Wir holen die 'lang' vom Layout (Sicherheits-Feature von SvelteKit)
        const { lang } = await parent();
        const client = createClient();

        try {
            // 2. Wir suchen explizit nach der UID 'home' in der ermittelten Sprache
            console.log(`[Page Load] Suche 'home' für Sprache: ${lang}`);

            const page = await client.getByUID('page', 'home', { lang });

            return {
                page,
                title: page.data.meta_title,
                meta_description: page.data.meta_description
            };
        } catch (e) {
            console.error(`[Page Load Error] Seite 'home' für Sprache ${lang} nicht gefunden.`);
            // Wenn 'home' nicht existiert, werfen wir einen 404
            throw error(404, {
                message: `Startseite 'home' für Sprache ${lang} nicht gefunden.`
            });
        }
    }
