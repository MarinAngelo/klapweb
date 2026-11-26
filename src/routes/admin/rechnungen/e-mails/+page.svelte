<script lang="ts">
	import type { PageData } from './$types';
	import MailPreview from '$lib/components/admin/MailPreview.svelte';

	export let data: PageData;
</script>

<MailPreview
	mails={data.mails}
	backHref="/admin/rechnungen"
	backLabel="Rechnungen"
	intro="Diese E-Mails verschickt die Website zu Rechnungen. Die Vorschau verwendet Ihre aktuellen Einstellungen und eine Beispiel-Rechnung; Name und E-Mail der Kundschaft sind Beispiele."
	from={data.from}
	style={data.style}
/>
