<script lang="ts">
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';
    import AddressBlock from '$lib/components/AddressBlock.svelte';
    import { _ } from '$lib/stores/i18n'; // Unser neuer Store
    import { page } from '$app/stores';

    export let data: any;

    // 1. Zentrale Datenquelle (Settings)
    $: settings = data?.settings?.data || $page.data?.settings?.data;

    // 2. Einzel-Variablen mit Fallbacks aus dem i18n-Store
    $: personCompany = settings?.responsible_person_company ?? $_('Verantwortliche Person/Firma fehlt');
    $: email = settings?.responsible_email ?? settings?.e_mail ?? $_('E-Mail fehlt');
    
    $: address = (Array.isArray(settings?.responsible_address) && settings.responsible_address.length > 0)
        ? settings.responsible_address
        : [{ type: 'paragraph', text: $_('Adresse fehlt'), spans: [] }];
    
    $: privacyField = (Array.isArray(settings?.privacy_policy) && settings.privacy_policy.length > 0) 
        ? settings.privacy_policy 
        : [];

    $: companyId = settings?.company_identification_number ?? '';

    $: cookiesField = (Array.isArray(settings?.cookies_text) && settings.cookies_text.length > 0)
        ? settings.cookies_text
        : [];

    /** * Da das Fallback für die Datenschutzerklärung sehr lang ist, 
     * ist es oft besser, es hier als Objekt zu lassen, 
     * aber die Texte dennoch über den Store zu ziehen.
     */
    $: fallback = [
        { 
            type: 'heading2', 
            text: $_('Erhebung und Verarbeitung von Daten'), 
            spans: [] 
        },
        { 
            type: 'paragraph', 
            text: $_('Beim Besuch dieser Website werden Zugriffsdaten gespeichert...'), 
            spans: [] 
        }
    ];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1 class="break-words hyphens-auto">
        {$_('Datenschutz')}
    </h1>
    
    <p>
        {$_('Diese Website verarbeitet personenbezogene Daten gemäß den gesetzlichen Bestimmungen.')}
    </p>

    <h2>{$_('Verantwortliche Stelle')}</h2>
    
    <AddressBlock
        responsible_person_company={personCompany}
        responsible_address={address}
        responsible_email={email}
    />

    {#if companyId}
        <p>{$_('UID')}: {companyId}</p>
    {/if}

    <h2>{$_('Einsatz von Cookies')}</h2>
    
    {#if cookiesField && cookiesField.length > 0}
        <PrismicRichText field={cookiesField} />
    {:else}
        <p class="whitespace-pre-line">{$_('Cookie-Informationstext')}</p>
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