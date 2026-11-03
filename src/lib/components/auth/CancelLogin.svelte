<script lang="ts">
	// "Abbrechen" for all login forms: back to the page the visitor came from (also via Escape)
	import { goto } from '$app/navigation';
	import { _ } from '$lib/stores/i18n';

	/** Target if there is no previous page on this site */
	export let fallback = '/';
	/** Escape key cancels as well */
	export let escape = true;
	let className = '';
	export { className as class };

	function cancel() {
		// document.referrer instead of history.back(): after a failed form submit the previous
		// history entry is the login page itself
		try {
			const ref = document.referrer ? new URL(document.referrer) : null;
			if (ref && ref.origin === location.origin && ref.pathname !== location.pathname) {
				goto(ref.pathname + ref.search);
				return;
			}
		} catch {
			/* invalid referrer → fallback */
		}
		goto(fallback);
	}

	function onKeydown(e: KeyboardEvent) {
		if (escape && e.key === 'Escape') cancel();
	}
</script>

<svelte:window on:keydown={onKeydown} />

<button type="button" on:click={cancel} class="text-muted text-sm underline {className}">
	{$_('Abbrechen')}
</button>
