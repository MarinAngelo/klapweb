<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import { errorPageLanding } from '$lib/stores/errorPageLanding';
	import Bounded from '$lib/components/Bounded.svelte';
	import Button from '$lib/components/Button.svelte';
	import MissingTranslationModal from '$lib/components/MissingTranslationModal.svelte';

	$: targetLang = $page.params.lang || $page.data.mainLang || 'de-ch';
	$: homeHref = targetLang === 'de-ch' ? '/' : `/${targetLang}`;

	// Page missing in a secondary language (no translation yet): show a modal in that language
	// and redirect to the same page in the default language. Real 404s keep the error page.
	$: mainLang = $page.data.mainLang || 'de-ch';
	$: segments = $page.url.pathname.split('/').filter(Boolean);
	$: locales = ($page.data.locales ?? []) as string[];
	// Language of the URL prefix: a secondary locale, or a mistyped / unknown language code
	// in the form xx-xx (e.g. "us-en" → "en-us"); unknown codes fall back to the default language
	$: pathLang = (() => {
		const first = (segments[0] ?? '').toLowerCase();
		if (!first || first === mainLang) return '';
		if (locales.includes(first)) return $page.data.lang === first ? first : '';
		if (!/^[a-z]{2}-[a-z]{2}$/.test(first)) return '';
		const [a, b] = first.split('-');
		return (
			locales.find((l) => l === `${b}-${a}`) ??
			locales.find((l) => l !== mainLang && [a, b].includes(l.split('-')[0])) ??
			mainLang
		);
	})();
	$: missingTranslation = $page.status === 404 && !!pathLang;
	// url.search is not available while prerendering → only in the browser
	$: defaultHref = '/' + segments.slice(1).join('/') + (browser ? $page.url.search : '');

	let mounted = false;

	onMount(() => {
		mounted = true;
		errorPageLanding.set(true);
		return () => errorPageLanding.set(false);
	});
</script>

<svelte:head>
	<!-- Error pages (404 …) never belong in search results; the HTTP status stays unchanged -->
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<!-- Missing translation: the modal redirects to the default language (browser only).
	 All other errors: content already in the server HTML -->
{#if mounted && missingTranslation}
	<MissingTranslationModal lang={pathLang} {mainLang} href={defaultHref} />
{:else if !missingTranslation}
	<Bounded as="section" class="text-center">
		<div class="error-content">
			<h1>
				{$page.status === 404 ? $_('Seite nicht gefunden') : $_('Etwas ist schiefgelaufen')}
			</h1>
			<p class="error-text">
				{$page.status === 404
					? $_('Diese Seite gibt es nicht oder sie wurde verschoben.')
					: $_('Bitte versuche es später noch einmal.')}
				{$_('Hier geht es zurück zur Startseite oder direkt zum Kontakt.')}
			</p>
			<div class="error-actions">
				<Button href={homeHref} text={$_('Zur Startseite')} mb={false} />
				<Button href="/kontakt" text={$_('Kontakt aufnehmen')} mb={false} />
			</div>
		</div>
	</Bounded>
{/if}

<style>
	.error-content {
		max-width: 36rem;
		margin: 0 auto;
		min-height: 50vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.error-text {
		margin: 1.5rem 0 2rem;
	}
	.error-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}
</style>
