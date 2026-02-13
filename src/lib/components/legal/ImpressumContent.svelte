<script lang="ts">
    import AddressBlock from '$lib/components/AddressBlock.svelte';
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';
    import { hardcodeTexts } from '$lib/i18n/hardcodeTexts';

    export let data: any;
    
    // Die Sprache aus den Daten ziehen (de-ch oder en-us)
    $: lang = data?.lang || 'de-ch';
    $: texts = lang === 'en-us' ? hardcodeTexts.en : hardcodeTexts.de;
    
    // Daten-Mapping
    $: settings = data?.settings?.data;
    $: contacts = settings?.contacts ?? [];

    $: responsible_person_company = settings?.responsible_person_company ?? texts.responsible_person_company;
    $: responsible_email = settings?.responsible_email ?? texts.responsible_email;
    $: legal_disclosure = settings?.legal_disclosure;
    
    $: responsible_address =
        Array.isArray(settings?.responsible_address) && settings.responsible_address.length > 0
            ? settings.responsible_address
            : [{ type: 'paragraph', text: texts.responsible_address, spans: [] }];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1>{lang === 'en-us' ? 'Legal Notice' : 'Impressum'}</h1>
    
    <h2>{lang === 'en-us' ? 'Contact & Responsibility' : 'Kontaktadresse & Verantwortlichkeit'}</h2>
    
    <AddressBlock {responsible_person_company} {responsible_address} {responsible_email} />
    
    {#if legal_disclosure}
        <PrismicRichText field={legal_disclosure} />
    {/if}

    <div class="mt-8">
        <h2>{lang === 'en-us' ? 'Sources & Realization' : 'Quellenangaben & Realisierung'}</h2>
        
        <h3 class="text-lg font-semibold">{lang === 'en-us' ? 'Web Development' : 'Webentwicklung'}</h3>
        <p>
            Angelo Klap<br />
            <strong>Website:</strong>
            <a href="https://www.klap-web.ch/" target="_blank" class="hover:underline text-inherit">
                Klap Web
            </a><br />
            <strong>E-Mail:</strong>
            <a href="mailto:admin@klap-web.ch" class="hover:underline text-inherit">admin@klap-web.ch</a>
        </p>

        {#if contacts.length > 0}
            {#each contacts as contact, i (contact)}
                <div class={i < contacts.length - 1 ? 'mb-6' : ''}>
                    {#if contact.title}
                        <h2 class="text-lg font-semibold">{contact.title}</h2>
                    {/if}
                    <AddressBlock
                        responsible_person_company={contact.name ?? ''}
                        responsible_address={contact.address ?? []}
                        responsible_email={contact.email ?? ''}
                    />
                    {#if contact.website?.url}
                        <p>
                            Website: <a href={contact.website.url} target="_blank" class="hover:underline text-inherit">
                                {contact.website.text || contact.website.url}
                            </a>
                        </p>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</main>

<style>
    .prose {
        max-width: 65ch;
    }
</style>