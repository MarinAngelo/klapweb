<script lang="ts">
    import { hardcodeTexts } from '$lib/i18n/hardcodeTexts';

    export let responsible_person_company: string;
    export let responsible_address: any[] | null | undefined;
    export let responsible_email: string;

    // Wir prüfen, ob der Inhalt einem der Fallbacks (DE oder EN) entspricht
    $: isCompanyFallback = 
        responsible_person_company === hardcodeTexts.de.responsible_person_company || 
        responsible_person_company === hardcodeTexts.en.responsible_person_company;

    $: isEmailFallback = 
        responsible_email === hardcodeTexts.de.responsible_email || 
        responsible_email === hardcodeTexts.en.responsible_email;

    // Hilfsfunktion für die Adresse
    const isAddressFallback = (text: string) => 
        text === hardcodeTexts.de.responsible_address || 
        text === hardcodeTexts.en.responsible_address;
</script>

<div class="prose address-block">
    <p class={isCompanyFallback ? "text-red-600" : ""}>
        {responsible_person_company}
    </p>

    {#if Array.isArray(responsible_address)}
        {#each (responsible_address ?? []).filter((b) => b.type === 'paragraph' && typeof b.text === 'string') as block}
            {#each block.text.split(/\r?\n/) as line}
                <p class={isAddressFallback(block.text) ? "text-red-600" : ""}>
                    {line}
                </p>
            {/each}
        {/each}
    {:else}
        <p class="text-red-600">{responsible_address}</p>
    {/if}

    {#if isEmailFallback}
        <p class="text-red-600">{responsible_email}</p>
    {:else if responsible_email}
        <p>
            E-Mail: <a
                href={`mailto:${responsible_email}`}
                class="hover:underline text-inherit"
                style="color: inherit;">{responsible_email}</a
            >
        </p>
    {/if}
</div>

<style>
    .address-block p {
        margin-bottom: 2px;
    }
</style>