<script lang="ts">
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
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

<div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
		<h3 class="text-lg font-bold mb-4">{title}</h3>
		<PrismicRichText field={message} />
		<button
			class="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
			on:click={onClose}
		>
			Schließen
		</button>
	</div>
</div>
