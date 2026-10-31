<script lang="ts">
	/**
	 * "No translation yet" notice in the visitor's language.
	 * - href set: redirects there after the countdown (e.g. /en-us/… → German version)
	 * - href empty: the page is already shown in the main language → closes after the countdown
	 */
	import { onMount, createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/translations';
	import { translationNoticeShown } from '$lib/stores/preferredLang';

	/** Language the visitor wanted (texts of the modal) */
	export let lang: string;
	/** Main language of the site (shown instead) */
	export let mainLang: string;
	export let href: string | null = null;
	export let seconds = 5;

	const dispatch = createEventDispatcher<{ close: void }>();
	let countdown = seconds;

	// Name of the main language in the visitor's language, e.g. "German"
	$: mainLangName = (() => {
		try {
			return (
				new Intl.DisplayNames([lang], { type: 'language' }).of(mainLang.split('-')[0]) ?? mainLang
			);
		} catch {
			return mainLang;
		}
	})();

	$: info = t(
		href
			? 'Weiterleitung zur Version auf {sprache} in {n} Sekunden …'
			: 'Die Seite wird auf {sprache} angezeigt ({n} s) …',
		lang
	)
		.replace('{sprache}', mainLangName)
		.replace('{n}', String(countdown));

	// The target page must not show the notice a second time (layout, remembered language)
	function markTarget() {
		if (href) translationNoticeShown.add(href.split(/[?#]/)[0]);
	}

	function finish() {
		markTarget();
		if (href) {
			if (window.location.pathname !== href.split('?')[0]) goto(href, { replaceState: true });
		} else {
			dispatch('close');
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !href) dispatch('close');
	}

	onMount(() => {
		const timer = setInterval(() => {
			if (countdown > 1) countdown -= 1;
			else {
				clearInterval(timer);
				finish();
			}
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div
	class="modal-backdrop fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
	role="dialog"
	aria-modal="true"
	aria-labelledby="no-translation-title"
>
	<div class="modal-card flex w-full max-w-md flex-col gap-4 rounded-lg p-8 text-center shadow-xl">
		<h2 id="no-translation-title" class="m-0">
			{t('Leider gibt es für diese Seite noch keine Übersetzung.', lang)}
		</h2>
		<p class="m-0 text-muted" aria-live="polite">{info}</p>
		{#if href}
			<a
				{href}
				class="btn-solid self-center rounded px-6 py-2 text-sm font-medium no-underline"
				data-sveltekit-replacestate
				on:click={markTarget}>{t('Jetzt wechseln', lang)}</a
			>
		{:else}
			<button
				type="button"
				class="btn-solid self-center rounded px-6 py-2 text-sm font-medium"
				on:click={() => dispatch('close')}>{t('OK', lang)}</button
			>
		{/if}
	</div>
</div>
