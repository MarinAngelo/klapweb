<script lang="ts">
	import type { FormSlice, FormSliceDefaultPrimaryFormFieldsItem } from '../../../prismicio-types';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/translations';
	export let slice: FormSlice;
	export let index: number = 0;
	export let slices: any[] = [];

	$: lang = $page.data.lang || 'de-ch';

	// kauf variation: config-only slice used in Settings/E-Commerce, never rendered on a page
	$: isKauf = (slice.variation as string) === 'kauf';
	$: isDefaultZweiSpalten =
		((slice.variation as string) === 'default' || (slice.variation as string) === 'mitTermin') &&
		(slice.primary as any)?.zwei_spalten === true;

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimation(
		slice.primary?.animate,
		slice.primary?.anim_direction,
		slice.primary?.anim_delay,
		slice.primary?.anim_duration
	);

	// CMS-Name hat Vorrang; Fallback: per-Seite-Zählung (form_1, form_2 ...)
	const formIndex = slices.slice(0, index + 1).filter((s) => s.slice_type === 'form').length;
	const formName = (slice.primary as any)?.form_name?.trim() || `form_${formIndex}`;
	const formFields = (slice.primary?.form_fields ?? []) as FormSliceDefaultPrimaryFormFieldsItem[];

	// Checkout-Modus: Wenn gesetzt → "Weiter" statt Netlify-Submit
	$: checkoutUrl =
		((slice.primary as any)?.checkout_url as string | null | undefined)?.trim() || null;
	$: mobileVollbreite = (slice.primary as any)?.mobile_full_width ?? false;

	// Technischer Schlüssel: E-Mail-Typ → immer "email", Textbereich → immer "message",
	// sonst normalisierter field_name (lowercase, nur a-z0-9) → konsistent über alle Sprachen
	const typeKeys: Record<string, string> = {
		'E-Mail': 'email',
		Textbereich: 'message',
		Land: 'land',
		Termin: 'termin'
	};

	function effectiveKey(field: FormSliceDefaultPrimaryFormFieldsItem): string {
		return (
			typeKeys[field.field_type ?? ''] ||
			(field.field_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') ||
			''
		);
	}

	// Fehlerstatus für jedes Feld
	let fieldErrors: Record<string, string> = {};
	const formSubmittetTitle = slice.primary?.submitted_title;
	const formSubmittetText = slice.primary?.submitted_text;

	// Zustand für das modale Fenster
	let showModal = false;

	// Fehlerausgabe für Link-Blocker
	let linkError: string | null = null;

	// Termin-Feld: nach Submit neu laden (gebuchter Termin verschwindet aus Liste)
	let termineRefreshKey = 0;

	function validateField(field: FormSliceDefaultPrimaryFormFieldsItem, value: unknown): string {
		if (!field || !effectiveKey(field)) return '';
		const val = String(value ?? '').trim();
		if (field.required && !val) {
			return field.invalid_feedback_text || t('Bitte Feld ausfüllen', lang);
		}
		// E-Mail-Validierung
		if (field.field_type === 'E-Mail' && val) {
			// sehr einfache Prüfung, wie in isEmail
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
				return t('Bitte eine gültige E-Mail-Adresse eingeben', lang);
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
			/\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/i, // domain.tld[/...]
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
			linkError = `${t('Links sind im Kontaktformular nicht erlaubt. Bitte entfernen Sie Links aus:', lang)} ${list}.`;
			return;
		}
		linkError = null;

		// Termin-Buchung: Slot reservieren bevor Formular abgesendet wird
		const terminField = formFields.find((f) => (f as any).field_type === 'Termin');
		if (terminField) {
			const terminId = formData.get('termin') as string;
			if (terminId) {
				const emailField = formFields.find((f) => (f as any).field_type === 'E-Mail');
				const nameField2 = formFields.find((f) => /^name$/i.test(effectiveKey(f)));
				const zeitzoneField = formFields.find((f) => (f as any).field_type === 'Zeitzone');
				const customerTimezone = zeitzoneField
					? (formData.get('zeitzone') as string) || undefined
					: undefined;
				try {
					const resp = await fetch('/api/buche-termin', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							terminId,
							name: nameField2 ? String(formData.get(effectiveKey(nameField2)) ?? '') : undefined,
							email: emailField ? String(formData.get('email') ?? '') : undefined,
							customerTimezone
						})
					});
					if (resp.status === 409) {
						const data = await resp.json();
						linkError = data.error ?? t('Dieser Termin ist leider nicht mehr verfügbar.', lang);
						return;
					}
					if (!resp.ok) {
						linkError = t('Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.', lang);
						return;
					}
				} catch {
					linkError = t('Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.', lang);
					return;
				}
			}
		}

		// Checkout-Modus: Daten in sessionStorage speichern und zur Zusammenfassung navigieren
		if (checkoutUrl) {
			const data: Record<string, string> = {};
			const labels: Record<string, string> = {};
			for (const [key, value] of formData.entries()) {
				if (typeof value === 'string') data[key] = value;
			}
			for (const field of formFields) {
				const key = effectiveKey(field);
				if (key) labels[key] = field.field_name ?? key;
			}
			sessionStorage.setItem('checkoutData', JSON.stringify({ data, labels }));
			const serviceUid = data['dienstleistung'] ?? '';
			const target = serviceUid
				? `${checkoutUrl}?service=${encodeURIComponent(serviceUid)}`
				: checkoutUrl;
			goto(target);
			return;
		}

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
				if (typeof value === 'string') {
					if (key === 'dienstleistung' && value === '') continue;
					params.append(key, value);
				}
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
				termineRefreshKey++;
			} else {
				console.error('Fehler beim Senden des Formulars:', response);
				alert(t('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.', lang));
			}
		} catch (error) {
			console.error('Netzwerkfehler oder anderer Fehler:', error);
			alert(t('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', lang));
		}
	}

	// URL-Parameter → wird als verstecktes Feld mitgesendet (z.B. ?dienst=DienstleistungA)
	let urlParams: Record<string, string> = {};

	onMount(() => {
		const search = new URLSearchParams(window.location.search);
		search.forEach((value, key) => {
			urlParams = { ...urlParams, [key]: value };
		});
		// Fallback: use current page UID if no ?dienstleistung= URL param present
		if (!urlParams.dienstleistung) {
			const uid = $page.params.uid;
			if (uid) urlParams = { ...urlParams, dienstleistung: uid };
		}
	});

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
	class={mobileVollbreite ? 'overflow-x-clip' : ''}
>
	<!-- kauf variation: only provides config data via Settings, renders nothing -->
	{#if isKauf}
		<!-- intentionally empty -->
	{:else}
		<!-- Standard: einspaltig -->
		<div
			class="grid grid-cols-1 items-center gap-8 {mobileVollbreite
				? '-mx-6 md:mx-0 px-6 md:px-0'
				: ''}"
		>
			<div>
				{#if slice.primary?.form_title}
					<Heading tag="h2" class="mt-0">{slice.primary?.form_title}</Heading>
				{/if}
				{#if slice.primary?.form_instructions}
					<PrismicRichText field={slice.primary?.form_instructions} />
				{/if}
			</div>
			<div>
				<form
					class="mt-16"
					name={formName}
					method="POST"
					data-netlify="true"
					on:submit={handleSubmit}
					on:input={onFormInput}
					aria-describedby="form-error"
					novalidate
				>
					<input type="hidden" name="form-name" value={formName} />
					<input type="hidden" name="dienstleistung" value={urlParams.dienstleistung ?? ''} />
					<p class="hidden" aria-hidden="true"><input name="bot-field" /></p>
					<div class={isDefaultZweiSpalten ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8' : ''}>
						{#each formFields as field}
							{#if field && effectiveKey(field)}
								<div class={isDefaultZweiSpalten && field.field_type === 'Textbereich' ? 'sm:col-span-2' : ''}>
									<InputField
										{field}
										refreshKey={termineRefreshKey}
										on:blur={(e) => onFieldBlur(e, field)}
									/>
									{#if fieldErrors[effectiveKey(field)]}
										<p class="text-red-600 text-sm mt-1">{fieldErrors[effectiveKey(field)]}</p>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
					{#if linkError}
						<p id="form-error" class="mt-3 text-sm text-red-600">
							{linkError}
						</p>
					{/if}
					<div class="mt-8 flex justify-end">
						<Button
							text={slice.primary?.submitt_button_text || 'Absenden'}
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
	{/if}

	{#if showModal}
		<Modal
			title={formSubmittetTitle || 'Vielen Dank!'}
			message={formSubmittetText?.length
				? formSubmittetText
				: [{ type: 'paragraph', text: 'Ihre Nachricht wurde erfolgreich gesendet.', spans: [] }]}
			onClose={() => (showModal = false)}
		/>
	{/if}
</Bounded>
