<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import InputField from '$lib/components/InputField.svelte';

	export let data: {
		dienstleistung: string;
		extraFields: Array<{
			field_name: string | null;
			field_type: string | null;
			required: boolean;
			options?: string | null;
			placeholder?: string | null;
			invalid_feedback_text?: string | null;
		}>;
	};

	// Hardcoded invoice fields (always required, always on invoice)
	const invoiceFields = [
		{ key: 'vorname',   label: 'Vorname',    type: 'text',  required: true,  span: 1 },
		{ key: 'nachname',  label: 'Nachname',   type: 'text',  required: true,  span: 1 },
		{ key: 'firma',     label: 'Firma',      type: 'text',  required: false, span: 1 },
		{ key: 'email',     label: 'E-Mail',     type: 'email', required: true,  span: 1 },
		{ key: 'adresse',   label: 'Adresse',    type: 'text',  required: true,  span: 2 },
		{ key: 'plz',       label: 'PLZ',        type: 'text',  required: true,  span: 1 },
		{ key: 'ort',       label: 'Ort',        type: 'text',  required: true,  span: 1 }
	];

	// Map extra fields (from Settings slices3) to InputField-compatible shape
	const typeKeys: Record<string, string> = { 'E-Mail': 'email', Textbereich: 'message', Land: 'land' };
	function extraFieldKey(f: typeof data.extraFields[0]): string {
		return typeKeys[f.field_type ?? ''] || (f.field_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || '';
	}

	let fieldErrors: Record<string, string> = {};
	let isSubmitting = false;

	function validate(): boolean {
		const errors: Record<string, string> = {};
		for (const f of invoiceFields) {
			if (f.required) {
				const el = document.querySelector<HTMLInputElement>(`[name="${f.key}"]`);
				if (!el?.value.trim()) errors[f.key] = 'Bitte ausfüllen';
			}
		}
		// Basic email check
		const emailEl = document.querySelector<HTMLInputElement>('[name="email"]');
		if (emailEl?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
			errors['email'] = 'Bitte gültige E-Mail eingeben';
		}
		for (const f of data.extraFields) {
			if (f.required) {
				const key = extraFieldKey(f);
				if (key) {
					const el = document.querySelector<HTMLInputElement>(`[name="${key}"]`);
					if (!el?.value.trim()) errors[key] = f.invalid_feedback_text || 'Bitte ausfüllen';
				}
			}
		}
		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;
		isSubmitting = true;

		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const checkoutData: { data: Record<string, string>; labels: Record<string, string> } = {
			data: {},
			labels: {}
		};

		// Invoice fields
		for (const f of invoiceFields) {
			const val = formData.get(f.key);
			if (typeof val === 'string' && val) {
				checkoutData.data[f.key] = val;
				checkoutData.labels[f.key] = f.label;
			}
		}
		// Extra fields
		for (const f of data.extraFields) {
			const key = extraFieldKey(f);
			if (!key) continue;
			const val = formData.get(key);
			if (typeof val === 'string' && val) {
				checkoutData.data[key] = val;
				checkoutData.labels[key] = f.field_name ?? key;
			}
		}
		// Dienstleistung (hidden, needed by zusammenfassung)
		checkoutData.data['dienstleistung'] = data.dienstleistung;

		sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
		goto(`/beauftragung/zusammenfassung?service=${encodeURIComponent(data.dienstleistung)}`);
	}

	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
</script>

<svelte:head>
	<title>Beauftragung</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">
	<Heading tag="h1">Beauftragung</Heading>

	<form on:submit={handleSubmit} novalidate class="mt-8 space-y-6">
		<!-- Hardcoded invoice fields -->
		<fieldset>
			<legend class="text-sm uppercase tracking-wide opacity-60 mb-4">Rechnungsadresse</legend>
			<div class="grid grid-cols-2 gap-4">
				{#each invoiceFields as f}
					<div class={f.span === 2 ? 'col-span-2' : ''}>
						<label class="block text-sm font-semibold mb-1" for={f.key}>
							{f.label}{f.required ? ' *' : ''}
						</label>
						<input
							id={f.key}
							name={f.key}
							type={f.type}
							required={f.required}
							class="w-full border px-3 py-2 bg-transparent focus:outline-none"
							style="border-color: {pageColor}44; color: {pageColor};"
						/>
						{#if fieldErrors[f.key]}
							<p class="text-red-500 text-xs mt-1">{fieldErrors[f.key]}</p>
						{/if}
					</div>
				{/each}
			</div>
		</fieldset>

		<!-- Extra fields from Settings -->
		{#if data.extraFields.length > 0}
			<fieldset>
				<legend class="text-sm uppercase tracking-wide opacity-60 mb-4">Weitere Angaben</legend>
				<div class="grid grid-cols-2 gap-4">
					{#each data.extraFields as field}
						{@const key = extraFieldKey(field)}
						{#if key}
							<div class="col-span-2">
								<InputField {field} />
								{#if fieldErrors[key]}
									<p class="text-red-500 text-xs mt-1">{fieldErrors[key]}</p>
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			</fieldset>
		{/if}

		<p class="text-xs opacity-60">* Pflichtfelder</p>

		<button
			type="submit"
			disabled={isSubmitting}
			class="button-prismic-link inline-block px-6 py-3 font-semibold rounded-full border transition duration-200 ease-in-out"
			style="background-color: {get(theme).pageButtonBgColor}; color: {get(theme).pageButtonColor}; border-color: {get(theme).pageButtonColor};"
		>
			{isSubmitting ? 'Bitte warten…' : 'Weiter zur Übersicht'}
		</button>
	</form>
</Bounded>
