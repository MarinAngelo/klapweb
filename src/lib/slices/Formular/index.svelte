<script lang="ts">
	import type { FormSlice, FormSliceDefaultPrimaryFormFieldsItem } from '../../prismicio-types';
	import { asText } from '@prismicio/client';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';

	export let slice: FormSlice;

	const { openIndex, toggleItem } = useOpenIndex();

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);

	const formFields = slice.primary.form_fields as FormSliceDefaultPrimaryFormFieldsItem[];

	// Fehlerstatus für jedes Feld
	let fieldErrors: Record<string, string> = {};
	const formSubmittetTitle = slice.primary.submitted_title;
	const formSubmittetText = asText(slice.primary.submitted_text);

	// Zustand für das modale Fenster
	let showModal = false;

	// Fehlerausgabe für Link-Blocker
	let linkError: string | null = null;

	function validateField(field: FormSliceDefaultPrimaryFormFieldsItem, value: unknown): string {
		if (!field || !field.field_name) return '';
		const val = String(value ?? '').trim();
		if (field.required && !val) {
			return field.invalid_feedback_text || 'Bitte Feld ausfüllen';
		}
		// E-Mail-Validierung
		if (field.field_type === 'E-Mail' && val) {
			// sehr einfache Prüfung, wie in isEmail
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
				return 'Bitte eine gültige E-Mail-Adresse eingeben';
			}
		}
		return '';
	}

	function onFieldBlur(event: Event, field: FormSliceDefaultPrimaryFormFieldsItem) {
		const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
			.value;
		const error = validateField(field, value);
		fieldErrors = { ...fieldErrors, [field.field_name ?? '']: error };
	}

	// --- Link-Detection (Client) ---
	function containsLink(raw: unknown): boolean {
		if (raw == null) return false;
		const v = String(raw);

		// Normalisierung gegen Obfuskation
		const normalized = v
			.replace(/\(dot\)/gi, '.')
			.replace(/\s*:\s*\/\s*\//g, '://') // auseinandergezogene Protokolle
			.replace(/\s+/g, ' ') // Mehrfachspaces
			.trim();

		// Email erlauben (z. B. someone@example.com)
		if (isEmail(normalized)) return false;

		const tests = [
			/\bhttps?:\/\/\S+/i, // http/https
			/\bwww\.\S+/i, // www.
			/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\/?\S*/i, // domain.tld[/...]
			/\[[^\]]+]\(\s*https?:\/\/[^)]+\)/i, // Markdown-Link
			/<a\s+[^>]*href\s*=\s*["']?\s*https?:\/\//i // HTML-Link
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
			if (name === 'form-name' || name === 'bot-field') continue;

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

		// Feld-Validierung (Pflicht & Typ)
		let errors: Record<string, string> = {};
		for (const field of formFields) {
			const value = formData.get(field.field_name ?? '');
			const error = validateField(field, value);
			if (error) {
				errors[field.field_name ?? ''] = error;
			}
		}
		fieldErrors = errors;
		if (Object.keys(errors).length > 0) {
			return;
		}

		// Clientseitige Link-Prüfung
		const offenders = validateNoLinks(formData);
		if (offenders.length > 0) {
			// Feldnamen schön darstellen (kommagetrennt)
			const list = offenders.map((n) => `„${n}”`).join(', ');
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
				fieldErrors = {};
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
	animate={anim.animate}
	animationOptions={anim.options}
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
					{#if field && field.field_name}
						<InputField {field} on:blur={(e) => onFieldBlur(e, field)} />
						{#if fieldErrors[field.field_name] && fieldErrors[field.field_name] !== ''}
							<p class="text-red-600 text-sm mt-1">{fieldErrors[field.field_name]}</p>
						{/if}
					{/if}
				{/each}

				{#if linkError}
					<p id="form-error" class="mt-3 text-sm text-red-600">
						{linkError}
					</p>
				{/if}

				<Button
					text={slice.primary.submitt_button_text || 'Absenden'}
					disabled={!!linkError}
					link={undefined}
					color={undefined}
					bgColor={undefined}
					hoverColor={undefined}
					hoverBgColor={undefined}
				/>
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
