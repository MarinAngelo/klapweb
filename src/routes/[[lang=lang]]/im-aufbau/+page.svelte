<script lang="ts">
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import { _ } from '$lib/stores/i18n';

	// Default target of «Startseite umleiten» when «Umleitungs-Seite» is empty
	$: settingsData = ($page.data.settings?.data ?? {}) as Record<string, any>;
	$: contactEmail = (settingsData.responsible_email as string | null)?.trim() || '';
</script>

<svelte:head>
	<title>{$_('Website im Aufbau')}{$page.data?.siteName ? ` - ${$page.data.siteName}` : ''}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Bounded tag="section">
	<div class="mx-auto max-w-xl py-16 text-center" data-pagefind-ignore data-page-search-ignore>
		<Heading tag="h1">{$_('Website im Aufbau')}</Heading>
		<p class="mt-6">
			{$_('Unsere neue Website entsteht gerade. Schauen Sie bald wieder vorbei.')}
		</p>
		{#if contactEmail}
			<p class="mt-6">
				{$_('Kontakt')}: <a class="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
			</p>
		{/if}
	</div>
</Bounded>
