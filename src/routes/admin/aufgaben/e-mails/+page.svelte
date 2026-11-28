<script lang="ts">
	import type { PageData } from './$types';
	import MailPreview from '$lib/components/admin/MailPreview.svelte';

	export let data: PageData;
</script>

<MailPreview
	mails={data.mails}
	backHref="/admin/aufgaben"
	backLabel="Aufgaben-Annahmen"
	intro="Diese E-Mails verschickt die Website zu den Aufgaben der Gäste. Die Vorschau verwendet Ihre aktuellen Einstellungen und eine Beispiel-Aufgabe; Name und E-Mail des Gastes sind Beispiele."
	from={data.from}
	style={data.style}
/>
