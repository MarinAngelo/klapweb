<script lang="ts">
	// Legal links (privacy, legal notice, AGB, disclaimer, cookie settings) — in the footer and as
	// the only footer part on landing pages (+layout.svelte)
	import type { Content } from '@prismicio/client';
	import { _ } from '$lib/stores/i18n';
	import { getLegalHref } from '$lib/utils/legalHref';
	import { consentSettingsOpen } from '$lib/stores/consent';

	export let settings: Content.SettingsDocument;
	export let lang: string | undefined;
	export let mainLang: string | undefined;

	$: settingsData = (settings?.data || {}) as Content.SettingsDocument['data'];
	// Legal pages in the current language
	$: getStaticHref = (deSlug: string, enSlug: string) =>
		getLegalHref(lang, mainLang, deSlug, enSlug);
</script>

<p class="footer-buttonbar-p">
	<a
		href={getStaticHref('datenschutzerklaerung', 'privacy-policy')}
		class="footer-link hover:underline"
	>
		{$_('Datenschutz')}
	</a>

	&nbsp;|&nbsp;

	<a href={getStaticHref('impressum', 'legal-notice')} class="footer-link hover:underline">
		{$_('Impressum')}
	</a>

	{#if settingsData.agb && settingsData.agb.length > 0}
		&nbsp;|&nbsp;
		<a href={getStaticHref('agb', 'terms-and-conditions')} class="footer-link hover:underline">
			{$_('AGB')}
		</a>
	{/if}
	{#if settingsData.haftungsausschluss && settingsData.haftungsausschluss.length > 0}
		&nbsp;|&nbsp;
		<a href={getStaticHref('haftungsausschluss', 'disclaimer')} class="footer-link hover:underline">
			{$_('Haftungsausschluss')}
		</a>
	{/if}

	&nbsp;|&nbsp;
	<button
		type="button"
		class="footer-link footer-consent-link hover:underline"
		on:click={() => consentSettingsOpen.set(true)}
	>
		{$_('Cookie-Einstellungen')}
	</button>
</p>

<style>
	.footer-consent-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
	}
</style>
