<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { asText } from '@prismicio/client';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';

	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Modal from '$lib/components/Modal.svelte';

	export let slice: Content.FormSlice;

	const formFields = slice.primary.form_fields;
	const formSubmittetTitle = slice.primary.submitted_title;
	const formSubmittetText = asText(slice.primary.submitted_text);

	// Zustand für das modale Fenster
	let showModal = false;

	// Fehlerausgabe für Link-Blocker
	let linkError: string | null = null;

	// --- Link-Detection (Client) ---
	function containsLink(raw: unknown): boolean {
		if (raw == null) return false;
		const v = String(raw);

		// Normalisierung gegen Obfuskation
		const normalized = v
			.replace(/\(dot\)/gi, ".")
			.replace(/\s*:\s*\/\s*\//g, "://")  // auseinandergezogene Protokolle
			.replace(/\s+/g, " ")               // Mehrfachspaces
			.trim();

		// Email erlauben (z. B. someone@example.com)
		if (isEmail(normalized)) return false;

		const tests = [
			/\bhttps?:\/\/\S+/i,                                        // http/https
			/\bwww\.\S+/i,                                               // www.
			/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\/?\S*/i,              // domain.tld[/...]
			/\[[^\]]+]\(\s*https?:\/\/[^)]+\)/i,                         // Markdown-Link
			/<a\s+[^>]*href\s*=\s*["']?\s*https?:\/\//i                  // HTML-Link
		];

		return tests.some((rx) => rx.test(normalized));
	}

	function isEmail(v: string): boolean {
		// einfache Email-Prüfung (bewusst tolerant)
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
	}

	function validateNoLinks(fd: FormData) {
		// Wenn du bestimmte Felder erlauben willst (z. B. "website"), hier whitelisten.
		// Beispiel: const whitelist = new Set(['website']);
		// und in der Schleife: if (whitelist.has(name)) continue;

		const offenders: string[] = [];
		for (const [name, value] of fd.entries()) {
			// Netlify/Hidden/Honeypot ignorieren
			if (name === "form-name" || name === "bot-field") continue;

			// File-Uploads ignorieren (hier blocken wir nur Textlinks)
			if (value instanceof File) continue;

			// reine Emails erlauben
			if (isEmail(String(value))) continue;

			// Link vorhanden?
			if (containsLink(value)) {
				offenders.push(name);
			}
		}
		return offenders;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Clientseitige Link-Prüfung
		const offenders = validateNoLinks(formData);
		if (offenders.length > 0) {
			// Feldnamen schön darstellen (kommagetrennt)
			const list = offenders
				.map((n) => `„${n}”`)
				.join(", ");
			linkError = `Links sind im Kontaktformular nicht erlaubt. Bitte entfernen Sie Links aus: ${list}.`;
			return;
		}
		linkError = null;

		try {
			const response = await fetch(form.action || '/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams(formData as any).toString()
			});

			if (response.ok) {
				showModal = true;
				form.reset();
			} else {
				console.error('Fehler beim Senden des Formulars:', response);
				alert('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
			}
		} catch (error) {
			console.error('Netzwerkfehler oder anderer Fehler:', error);
			alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
		}
	}

	// Optional: Live-Validierung beim Tippen (löscht die Fehlermeldung, sobald keine Links mehr da sind)
	function onFormInput(e: Event) {
		if (linkError) {
			const form = e.currentTarget as HTMLFormElement;
			const fd = new FormData(form);
			const offenders = validateNoLinks(fd);
			linkError = offenders.length ? linkError : null;
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
				on:input={onFormInput}
				aria-describedby="form-error"
				novalidate
			>
				<input type="hidden" name="form-name" value="contact" />
				<div hidden>
					<label>
						Don't fill this out: <input name="bot-field" />
					</label>
				</div>

				{#each formFields as field}
					<InputField {field} />
				{/each}

				{#if linkError}
					<p id="form-error" class="mt-3 text-sm text-red-600">
						{linkError}
					</p>
				{/if}

				<button
					type="submit"
					class="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					disabled={!!linkError}
				>
					{slice.primary.submitt_button_text || 'Absenden'}
				</button>
			</form>
		</div>
	</div>

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
