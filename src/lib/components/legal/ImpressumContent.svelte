<script lang="ts">
    import AddressBlock from '$lib/components/AddressBlock.svelte';
    import PrismicRichText from '$lib/components/PrismicRichText.svelte';
    import { _ } from '$lib/stores/i18n'; // Unser neuer Store

    export let data: any;
    
    // Daten-Mapping
    $: settings = data?.settings?.data;
    $: contacts = settings?.contacts ?? [];

    // Fallbacks über den Store steuern
    $: responsible_person_company = settings?.responsible_person_company ?? $_('Verantwortliche Person/Firma fehlt');
    $: responsible_email = settings?.responsible_email ?? $_('E-Mail fehlt');
    $: legal_disclosure = settings?.legal_disclosure;
    
    $: responsible_address =
        Array.isArray(settings?.responsible_address) && settings.responsible_address.length > 0
            ? settings.responsible_address
            : [{ type: 'paragraph', text: $_('Adresse fehlt'), spans: [] }];
</script>

<main class="prose mx-auto py-12 px-4 sm:px-6">
    <h1>{$_('Impressum')}</h1>
    
    <h2>{$_('Kontaktadresse & Verantwortlichkeit')}</h2>
    
    <AddressBlock {responsible_person_company} {responsible_address} {responsible_email} />
    
    {#if legal_disclosure}
        <PrismicRichText field={legal_disclosure} />
    {/if}

    <div class="mt-8">
        <h2>{$_('Quellenangaben & Realisierung')}</h2>
        
        <h3 class="text-lg font-semibold">{$_('Webentwicklung')}</h3>
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