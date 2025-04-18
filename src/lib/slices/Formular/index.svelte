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

	async function handleSubmit(event: Event) {
		event.preventDefault(); // Verhindert Standard-Submit (Bleibt)

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			// Sende die Formulardaten an den Endpunkt des aktuellen Pfads
			// Netlify fängt POST-Requests an den Pfad ab, auf dem das Formular liegt
			const response = await fetch(form.action || '/', {
				// Nutze form.action oder den aktuellen Pfad '/'
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				// Wichtig: FormData korrekt kodieren für Netlify
				body: new URLSearchParams(formData as any).toString()
			});

			if (response.ok) {
				// Erfolgreich gesendet! Jetzt Modal anzeigen und Formular zurücksetzen
				console.log('Formular erfolgreich via AJAX gesendet.');
				showModal = true; // Modal anzeigen
				form.reset(); // Formular zurücksetzen
			} else {
				// Fehler beim Senden
				console.error('Fehler beim Senden des Formulars:', response);
				// Optional: Zeige eine Fehlermeldung für den Benutzer an
				alert('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
			}
		} catch (error) {
			// Netzwerkfehler o.ä.
			console.error('Netzwerkfehler oder anderer Fehler:', error);
			// Optional: Zeige eine Fehlermeldung für den Benutzer an
			alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
		}
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
