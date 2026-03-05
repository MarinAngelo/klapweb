<script lang="ts">
	import type { FormSlice, FormSliceDefaultPrimaryFormFieldsItem } from '../../prismicio-types';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { theme } from '$lib/stores/theme';
	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';

	export let slice: FormSlice;
	export let index: number = 0;
	export let slices: any[] = [];


	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);

	// Zählt nur Formular-Slices bis einschließlich dem aktuellen → form_1, form_2 ...
	const formIndex = slices.slice(0, index + 1).filter((s) => s.slice_type === 'form').length;
	const formName = `form_${formIndex}`;
	const formFields = slice.primary.form_fields as FormSliceDefaultPrimaryFormFieldsItem[];

	// Technischer Schlüssel: E-Mail-Typ → immer "email", Textbereich → immer "message",
	// sonst normalisierter field_name (lowercase, nur a-z0-9) → konsistent über alle Sprachen
	const typeKeys: Record<string, string> = { 'E-Mail': 'email', Textbereich: 'message' };
	function effectiveKey(field: FormSliceDefaultPrimaryFormFieldsItem): string {
		return (
			typeKeys[field.field_type] ||
			(field.field_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') ||
			''
		);
	}

	// Fehlerstatus für jedes Feld
	let fieldErrors: Record<string, string> = {};
	const formSubmittetTitle = slice.primary.submitted_title;
	const formSubmittetText = slice.primary.submitted_text;

	// Zustand für das modale Fenster
	let showModal = false;

	// Fehlerausgabe für Link-Blocker
	let linkError: string | null = null;

	// Fehlerausgabe für Sende-Fehler (ersetzt alert())
	let submitError: string | null = null;

	function validateField(field: FormSliceDefaultPrimaryFormFieldsItem, value: unknown): string {
		if (!field || !effectiveKey(field)) return '';
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
		fieldErrors = { ...fieldErrors, [effectiveKey(field)]: error };
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
			const value = formData.get(effectiveKey(field));
			const error = validateField(field, value);
			if (error) {
				errors[effectiveKey(field)] = error;
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

		// Netlify "subject"-Feld = Wert des Name-Feldes → wird als Titel/Betreff angezeigt
		const nameField = formFields.find((f) => /^name$/i.test(effectiveKey(f)));
		if (nameField) {
			const nameVal = formData.get(effectiveKey(nameField));
			if (nameVal) formData.set('subject', String(nameVal));
		}

		try {
			// Explizit alle Entries iterieren – vermeidet Probleme mit FormData as any Cast
			const params = new URLSearchParams();
			for (const [key, value] of formData.entries()) {
				if (typeof value === 'string') params.append(key, value);
			}

			// Im Dev-Modus → lokaler Mock-Endpunkt
			// In Production → Netlify CDN fängt den POST ab (form-name im Body)
			const endpoint = import.meta.env.DEV ? '/api/form' : '/';
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: params.toString()
			});

			if (response.ok) {
				showModal = true;
				form.reset();
				fieldErrors = {};
				submitError = null;
			} else {
				submitError = 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.';
			}
		} catch (error) {
			submitError = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
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
	style="background-color: {$theme.pageBgColor}; color: {$theme.pageColor};"
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
				name={formName}
				method="POST"
				data-netlify="true"
				on:submit={handleSubmit}
				on:input={onFormInput}
				aria-describedby="form-error"
				novalidate
			>
				<input type="hidden" name="form-name" value={formName} />

				{#each formFields as field}
					{#if field && effectiveKey(field)}
						<InputField {field} on:blur={(e) => onFieldBlur(e, field)} />
						{#if fieldErrors[effectiveKey(field)]}
							<p class="text-red-600 text-sm mt-1">{fieldErrors[effectiveKey(field)]}</p>
						{/if}
					{/if}
				{/each}

				{#if linkError}
					<p id="form-error" class="mt-3 text-sm text-red-600">
						{linkError}
					</p>
				{/if}

				{#if submitError}
					<p class="mt-3 text-sm text-red-600" role="alert">
						{submitError}
					</p>
				{/if}

				<div class="mt-8 flex justify-end">
				<Button
					text={slice.primary.submitt_button_text || 'Absenden'}
					disabled={!!linkError}
					link={undefined}
					color={undefined}
					bgColor={undefined}
					hoverColor={undefined}
					hoverBgColor={undefined}
				/>
				</div>
			</form>
		</div>
	</div>

	{#if showModal}
		<Modal
			title={formSubmittetTitle || 'Vielen Dank!'}
			message={formSubmittetText?.length ? formSubmittetText : [{ type: 'paragraph', text: 'Ihre Nachricht wurde erfolgreich gesendet.', spans: [] }]}
			onClose={() => (showModal = false)}
		/>
	{/if}
</Bounded>
