<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { RichTextField } from '@prismicio/types';
	import { _ } from '$lib/stores/i18n';

	export let title: string = 'Vielen Dank!';
	export let message: RichTextField = [
		{
			type: 'paragraph',
			text: 'Ihre Nachricht wurde erfolgreich gesendet.',
			spans: []
		}
	];
	export let onClose: () => void;
</script>

<div class="fixed inset-0 flex items-center justify-center z-50 [background-color:rgba(0,0,0,0.4)]">
	<div class="rounded-lg shadow-lg p-8 max-w-md w-full mx-4 bg-page-bg text-page">
		<p class="text-xl font-bold mb-4">{title}</p>
		<div class="mb-6">
			<PrismicRichText field={message} />
		</div>
		<Button link={undefined} text={$_('Schliessen')} on:click={onClose} />
	</div>
</div>
