<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { RichTextField } from '@prismicio/types';

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

<div class="fixed inset-0 flex items-center justify-center z-50" style="background-color: rgba(0,0,0,0.4);">
	<div
		class="rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
		style="background-color: var(--page-bg-color); color: var(--page-color);"
	>
		<h3 class="text-xl font-bold mb-4">{title}</h3>
		<div class="mb-6">
			<PrismicRichText field={message} />
		</div>
		<Button link={undefined} text="Schließen" on:click={onClose} />
	</div>
</div>
