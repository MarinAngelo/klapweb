<script lang="ts">
	import type { PageData } from './$types';
	import MailPreview from '$lib/components/admin/MailPreview.svelte';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;
</script>

<MailPreview
	mails={data.mails}
	backHref="/admin/ressource-buchungen"
	backLabel="Ressource-Buchungen"
	intro="Diese E-Mails verschickt die Ressourcen-Buchung. Die Vorschau verwendet die Texte der ersten Ressource und eine Beispiel-Buchung; Name und E-Mail des Gastes sind Beispiele. Mails an Gäste kommen in der Sprache der Buchung, Mails an Sie immer auf Deutsch."
	from={data.from}
	languages={data.languages}
	lang={data.mailLang}
>
	{$_('Beispiel-Ressource')}: {data.example.ressourceName}
	{#if !data.example.fromPrismic}({$_('keine Ressource gefunden — erfundenes Beispiel')}){/if}
	·
</MailPreview>
