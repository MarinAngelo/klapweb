<script lang="ts">
	import type { PageData } from './$types';
	import MailPreview from '$lib/components/admin/MailPreview.svelte';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;
</script>

<MailPreview
	mails={data.mails}
	backHref="/admin/buchungen"
	backLabel="Terminverwaltung"
	intro="Diese E-Mails verschickt die Terminbuchung automatisch. Die Vorschau verwendet Ihre aktuellen Einstellungen und einen Beispiel-Termin; Name und E-Mail der Kundschaft sind Beispiele."
	from={data.from}
	style={data.style}
>
	{$_('Beispiel-Termin')}: {data.example.titel}, {data.example.dateLabel}
	{#if !data.example.fromPrismic}({$_('kein freier Termin gefunden — erfundenes Beispiel')}){/if}
	·
</MailPreview>
