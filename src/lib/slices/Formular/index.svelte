<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { asText } from '@prismicio/client';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte'; // Import der neuen Komponente
	import Modal from '$lib/components/Modal.svelte'; // Import der Modal-Komponente

	export let slice: Content.FormSlice;

	const formFields = slice.primary.form_fields;
	const formSubmittetTitle = slice.primary.submitted_title;
	const formSubmittetText = asText(slice.primary.submitted_text);

	// Zustand für das modale Fenster
	let showModal = false;

	// Funktion, die beim Absenden des Formulars aufgerufen wird
	function handleSubmit(event: Event) {
		event.preventDefault(); // Verhindert das Standardverhalten des Formulars

		 // Formulardaten auslesen
        const formData = new FormData(event.target as HTMLFormElement);

        // Alle Werte loggen
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

		// Modales Fenster anzeigen
		showModal = true;

		// Formular zurücksetzen
		const form = event.target as HTMLFormElement;
		form.reset();
	}
</script>

<Bounded
	as="section"
	style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-1 items-center gap-8">
		<div>
			{#if slice.primary.form_title}
				<h2 class="text-2xl font-bold">
					{slice.primary.form_title}
				</h2>
			{/if}
			{#if slice.primary.form_instructions}
				<PrismicRichText field={slice.primary.form_instructions} />
			{/if}
		</div>
		<div>
			<form
				name="contact"
				method="POST"
				data-netlify="true"
				netlify-honeypot="bot-field"
				on:submit={handleSubmit}
			>
				<!-- Honeypot-Feld für Spam-Schutz -->
				<input type="hidden" name="form-name" value="contact" />
				<div hidden>
					<label>
						Don't fill this out: <input name="bot-field" />
					</label>
				</div>

				<!-- Iteration über die Felder -->
				{#each formFields as field}
					<InputField {field} />
				{/each}

				<!-- Submit-Button -->
				<button
					type="submit"
					class="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					{slice.primary.submitt_button_text || 'Absenden'}
				</button>
			</form>
		</div>
	</div>

	<!-- Modales Fenster -->
	{#if showModal}
		<Modal
			title={formSubmittetTitle || 'Vielen Dank!'}
			message={[
				{
					type: 'paragraph',
					text: formSubmittetText || 'Ihre Nachricht wurde erfolgreich gesendet.',
					spans: []
				}
			]}
			onClose={() => (showModal = false)}
		/>
	{/if}
</Bounded>
