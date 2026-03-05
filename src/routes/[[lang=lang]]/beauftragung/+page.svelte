<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import InputField from '$lib/components/InputField.svelte';

	export let data: {
		dienstleistung: string;
		pageTitle: string;
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
	function extraFieldSpan(f: typeof data.extraFields[0]): number {
		return f.field_type === 'Textbereich' ? 2 : 1;
	}

	$: hasTabs = data.extraFields.length > 0;
	let activeTab: 'rechnung' | 'weitere' = 'rechnung';

	let fieldErrors: Record<string, string> = {};
	let isSubmitting = false;

	$: invoiceKeys = new Set(invoiceFields.map(f => f.key));
	$: hasInvoiceErrors = Object.keys(fieldErrors).some(k => invoiceKeys.has(k) && fieldErrors[k]);
	$: hasExtraErrors = Object.keys(fieldErrors).some(k => !invoiceKeys.has(k) && fieldErrors[k]);

	function validateInvoice(): boolean {
		const errors: Record<string, string> = {};
		for (const f of invoiceFields) {
			if (f.required) {
				const el = document.querySelector<HTMLInputElement>(`[name="${f.key}"]`);
				if (!el?.value.trim()) errors[f.key] = 'Bitte ausfüllen';
			}
		}
		const emailEl = document.querySelector<HTMLInputElement>('[name="email"]');
		if (emailEl?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
			errors['email'] = 'Bitte gültige E-Mail eingeben';
		}
		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	}

	function validateExtra(): boolean {
		const errors: Record<string, string> = {};
		for (const f of data.extraFields) {
			if (f.required) {
				const key = extraFieldKey(f);
				if (key) {
					const el = document.querySelector<HTMLInputElement>(`[name="${key}"]`);
					if (!el?.value.trim()) errors[key] = f.invalid_feedback_text || 'Bitte ausfüllen';
				}
			}
		}
		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		// Tab 1 → validate invoice fields only, then advance to Tab 2
		if (hasTabs && activeTab === 'rechnung') {
			if (!validateInvoice()) return;
			activeTab = 'weitere';
			return;
		}

		// Tab 2 or no tabs → validate everything
		const invoiceOk = validateInvoice();
		const extraOk = validateExtra();
		if (!invoiceOk) { activeTab = 'rechnung'; return; }
		if (!extraOk) return;

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
	<title>{data.pageTitle}</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">
	<Heading tag="h1">{data.pageTitle}</Heading>

	<form on:submit={handleSubmit} novalidate class="mt-8 space-y-6">

		<!-- Tab navigation (only when extra fields exist) -->
		{#if hasTabs}
			<div class="flex border-b" style="border-color: {pageColor}33;">
				<button
					type="button"
					on:click={() => (activeTab = 'rechnung')}
					class="px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
					style="border-color: {activeTab === 'rechnung' ? pageColor : 'transparent'}; opacity: {activeTab === 'rechnung' ? 1 : 0.5};"
				>
					Rechnungsadresse{hasInvoiceErrors ? ' ●' : ''}
				</button>
				<button
					type="button"
					on:click={() => (activeTab = 'weitere')}
					class="px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
					style="border-color: {activeTab === 'weitere' ? pageColor : 'transparent'}; opacity: {activeTab === 'weitere' ? 1 : 0.5};"
				>
					Weitere Angaben{hasExtraErrors ? ' ●' : ''}
				</button>
			</div>
		{/if}

		<!-- Rechnungsadresse -->
		<fieldset class:hidden={hasTabs && activeTab !== 'rechnung'}>
			{#if !hasTabs}
				<legend class="text-sm uppercase tracking-wide opacity-60 mb-4">Rechnungsadresse</legend>
			{/if}
			<div class="grid grid-cols-2 gap-x-8">
				{#each invoiceFields as f}
					<div class="mb-4 {f.span === 2 ? 'col-span-2' : ''}">
						<label class="block text-base font-bold" for={f.key}>
							{f.label}{f.required ? ' *' : ''}
						</label>
						<input
							id={f.key}
							name={f.key}
							type={f.type}
							required={f.required}
							class="mt-1 p-2 block w-full rounded-none border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
							style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px;"
						/>
						{#if fieldErrors[f.key]}
							<p class="text-red-500 text-xs mt-1">{fieldErrors[f.key]}</p>
						{/if}
					</div>
				{/each}
			</div>
		</fieldset>

		<!-- Weitere Angaben (extra fields from Settings) -->
		{#if hasTabs}
			<fieldset class:hidden={activeTab !== 'weitere'}>
				<div class="grid grid-cols-2 gap-x-8">
					{#each data.extraFields as field}
						{@const key = extraFieldKey(field)}
						{@const span = extraFieldSpan(field)}
						{#if key}
							<div class={span === 2 ? 'col-span-2' : ''}>
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
			{isSubmitting ? 'Bitte warten…' : (hasTabs && activeTab === 'rechnung') ? 'Weiter' : 'Weiter zur Übersicht'}
		</button>
	</form>
</Bounded>
