<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { RichTextField } from '@prismicio/types';
	import { _ } from '$lib/stores/i18n';

	/** Empty → translated default */
	export let title: string | null | undefined = undefined;
	/** Rich text from the CMS; empty → `text` or the translated default */
	export let message: RichTextField | null | undefined = undefined;
	export let text: string | undefined = undefined;
	export let onClose: () => void;

	$: heading = title || $_('Vielen Dank!');
	$: hasMessage = !!message?.length;
	$: richMessage = (message ?? []) as RichTextField;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
	<div
		class="modal-card rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<p id="modal-title" class="text-xl font-bold mb-4">{heading}</p>
		<div class="mb-6">
			{#if hasMessage}
				<PrismicRichText field={richMessage} />
			{:else}
				<p>{text || $_('Ihre Nachricht wurde erfolgreich gesendet.')}</p>
			{/if}
		</div>
		<Button link={undefined} text={$_('Schliessen')} on:click={onClose} />
	</div>
</div>
