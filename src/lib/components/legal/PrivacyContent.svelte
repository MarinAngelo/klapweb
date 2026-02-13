<script lang="ts">
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';
    import AddressBlock from '$lib/components/AddressBlock.svelte';
    import { hardcodeTexts } from '$lib/i18n/hardcodeTexts';
    import { page } from '$app/stores';

    export let data: any;

    // 1. Sprache und Basis-Texte (Immer sicher)
    $: lang = data?.lang || 'de-ch';
    $: texts = lang === 'en-us' ? hardcodeTexts.en : hardcodeTexts.de;

    // 2. Zentrale Datenquelle (Wir nennen sie "settings", um Verwirrung zu vermeiden)
    // Wir prüfen erst data (Route) dann $page.data (Layout)
    $: settings = data?.settings?.data || $page.data?.settings?.data;

    // 3. Einzel-Variablen mit "Optional Chaining" und Fallbacks
    $: personCompany = settings?.responsible_person_company ?? texts.responsible_person_company;
    $: email = settings?.responsible_email ?? settings?.e_mail ?? texts.responsible_email;
    
    $: address = (Array.isArray(settings?.responsible_address) && settings.responsible_address.length > 0)
        ? settings.responsible_address
        : [{ type: 'paragraph', text: texts.responsible_address, spans: [] }];
    
    $: privacyField = (Array.isArray(settings?.privacy_policy) && settings.privacy_policy.length > 0) 
        ? settings.privacy_policy 
        : [];

    $: cookiesField = (Array.isArray(settings?.cookies_text) && settings.cookies_text.length > 0)
        ? settings.cookies_text
        : [];

    // Fallback für den Fall, dass privacyField leer ist
    $: fallback = lang === 'en-us' ? [
        { type: 'heading2', text: 'Collection and Processing of Data', spans: [] },
        { type: 'paragraph', text: 'When visiting this website, access data are stored...', spans: [] }
    ] : [
        { type: 'heading2', text: 'Erhebung und Verarbeitung von Daten', spans: [] },
        { type: 'paragraph', text: 'Beim Besuch dieser Website werden Zugriffsdaten gespeichert...', spans: [] }
    ];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1 class="break-words hyphens-auto">
        {lang === 'en-us' ? 'Privacy Policy' : 'Datenschutzerklärung'}
    </h1>
    
    <p>
        {lang === 'en-us' 
            ? 'This website processes personal data in accordance with legal regulations.'
            : 'Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen.'}
    </p>

    <h2>{lang === 'en-us' ? 'Responsible Body' : 'Verantwortliche Stelle'}</h2>
    
    <AddressBlock
        responsible_person_company={personCompany}
        responsible_address={address}
        responsible_email={email}
    />

    <h2>{lang === 'en-us' ? 'Use of Cookies' : 'Einsatz von Cookies'}</h2>
    
    {#if cookiesField && cookiesField.length > 0}
        <PrismicRichText field={cookiesField} />
    {:else}
        <p>{texts.cookies_text}</p>
    {/if}

    <PrismicRichText
        field={privacyField && privacyField.length > 0 ? privacyField : fallback}
    />
</main>

<style>
    .prose {
        max-width: 65ch;
    }
</style>