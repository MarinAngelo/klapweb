<script lang="ts">
	import { t } from '$lib/i18n/translations';
	import { page } from '$app/stores';

	export let responsible_person_company: string;
	export let responsible_address: any[] | null | undefined;
	export let responsible_email: string;

	// Wir holen die aktuelle Sprache, um die Fallbacks dynamisch zu prüfen
	$: lang = $page.data.lang || 'de-ch';

	// Wir vergleichen den aktuellen Wert mit dem (übersetzten) Key aus translations.ts
	// Falls der Wert dem Warnhinweis entspricht, färben wir ihn rot.
	$: isCompanyFallback =
		responsible_person_company === t('Verantwortliche Person/Firma fehlt', lang);

	$: isEmailFallback = responsible_email === t('E-Mail fehlt', lang);

	// Hilfsfunktion für die Adresse
	$: addressFallbackText = t('Adresse fehlt', lang);
	const isAddressFallback = (text: string) => text === addressFallbackText;
</script>

<div class="prose address-block">
	<p class={isCompanyFallback ? 'text-red-600 font-semibold' : ''}>
		{responsible_person_company}
	</p>

	{#if Array.isArray(responsible_address)}
		{#each (responsible_address ?? []).filter((b) => b.type === 'paragraph' && typeof b.text === 'string') as block}
			{#each block.text.split(/\r?\n/) as line}
				<p class={isAddressFallback(block.text) ? 'text-red-600 font-semibold' : ''}>
					{line}
				</p>
			{/each}
		{/each}
	{:else if responsible_address}
		<p class="text-red-600 font-semibold">{responsible_address}</p>
	{/if}

	{#if isEmailFallback}
		<p class="text-red-600 font-semibold">{responsible_email}</p>
	{:else if responsible_email}
		<p>
			<strong>E-Mail:</strong>
			<a href={`mailto:${responsible_email}`} class="hover:underline">{responsible_email}</a>
		</p>
	{/if}
</div>

<style>
	.address-block p {
		margin-bottom: 2px;
	}
</style>
