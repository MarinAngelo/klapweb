<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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

	let countdown = 15;
	let timer: any;
	let mounted = false;

	onMount(() => {
		mounted = true;
		errorPageLanding.set(true);

		// Missing translation: MissingTranslationModal redirects itself
		if (missingTranslation) return () => errorPageLanding.set(false);

		countdown = 15;
		const target = homeHref;
		timer = setInterval(() => {
			if (countdown > 1) {
				countdown -= 1;
			} else {
				clearInterval(timer);
				if (window.location.pathname !== target) {
					goto(target, { replaceState: true });
				}
			}
		}, 1000);

		return () => {
			clearInterval(timer);
			errorPageLanding.set(false);
		};
	});
</script>

{#if mounted && missingTranslation}
	<MissingTranslationModal lang={pathLang} {mainLang} href={defaultHref} />
{:else if mounted}
	<div class="error-container">
		<Bounded as="section" class="text-center">
			<div class="content-wrapper">
				<span class="status-code">Status {$page.status}</span>

				<h1 class="error-title">{$_('Seite nicht gefunden')}</h1>

				<p class="error-text">
					{$_('Diese Seite existiert in der gewählten Sprache leider noch nicht.')}
				</p>

				<div class="actions">
					<Button link={{ url: homeHref }} text={$_('Zurück zur Hauptseite')} />

					<div class="countdown-wrapper">
						<div class="spinner"></div>
						<span>{$_('Automatische Weiterleitung in')} <strong>{countdown}s</strong></span>
					</div>
				</div>
			</div>
		</Bounded>
	</div>
{/if}

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		background: transparent;
		color: var(--page-color);
		font-family: var(--page-font);
	}

	.content-wrapper {
		max-width: 32rem;
		margin: 0 auto;
	}

	.status-code {
		display: block;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ef4444;
		margin-bottom: 0.5rem;
	}

	.error-title {
		font-size: clamp(2rem, 8vw, 3rem);
		font-weight: 900;
		line-height: 1.1;
		margin-bottom: 1.5rem;
	}

	.error-text {
		font-size: 1.125rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		opacity: 0.8;
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.countdown-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
