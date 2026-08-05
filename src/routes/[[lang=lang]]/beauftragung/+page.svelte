<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import { t } from '$lib/i18n/translations';

	export let data: {
		dienstleistung: string;
		pageTitle: string;
		eventCheckout: boolean;
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
	const allInvoiceFields = [
		{ key: 'vorname',   label: 'Vorname',    type: 'text',  required: true,  span: 1 },
		{ key: 'nachname',  label: 'Nachname',   type: 'text',  required: true,  span: 1 },
		{ key: 'firma',     label: 'Firma',      type: 'text',  required: false, span: 1 },
		{ key: 'email',     label: 'E-Mail',     type: 'email', required: true,  span: 1 },
		{ key: 'adresse',   label: 'Adresse',    type: 'text',  required: true,  span: 2 },
		{ key: 'plz',       label: 'PLZ',        type: 'text',  required: true,  span: 1 },
		{ key: 'ort',       label: 'Ort',        type: 'text',  required: true,  span: 1 },
		{ key: 'land',      label: 'Land',       type: 'select', required: true,  span: 1 },
		{ key: 'tel',       label: 'Tel. Nr.',   type: 'tel',    required: true,  span: 1 },
		{ key: 'projektname', label: 'Projektname', type: 'text', required: true, span: 1 },
		{ key: 'registrierter_domainname', label: 'Registrierter Domainname', type: 'text', required: false, span: 1 },
		{ key: 'gewuenschter_domainname', label: 'Gewünschter Domainname', type: 'text', required: false, span: 1 }
	];

	const eventOnlyFields = new Set(['projektname', 'registrierter_domainname', 'gewuenschter_domainname']);
	$: invoiceFields = data.eventCheckout
		? allInvoiceFields.filter((f) => !eventOnlyFields.has(f.key))
		: allInvoiceFields;

	// Map extra fields (from Settings slices3) to InputField-compatible shape
const vorwahlen = [
		{ code: '+41', label: '🇨🇭 +41' },
		{ code: '+49', label: '🇩🇪 +49' },
		{ code: '+43', label: '🇦🇹 +43' },
		{ code: '+423', label: '🇱🇮 +423' },
		{ code: '—', label: '——————' },
		{ code: '+1', label: '🇺🇸 +1' },
		{ code: '+7', label: '🇷🇺 +7' },
		{ code: '+20', label: '🇪🇬 +20' },
		{ code: '+27', label: '🇿🇦 +27' },
		{ code: '+30', label: '🇬🇷 +30' },
		{ code: '+31', label: '🇳🇱 +31' },
		{ code: '+32', label: '🇧🇪 +32' },
		{ code: '+33', label: '🇫🇷 +33' },
		{ code: '+34', label: '🇪🇸 +34' },
		{ code: '+36', label: '🇭🇺 +36' },
		{ code: '+39', label: '🇮🇹 +39' },
		{ code: '+40', label: '🇷🇴 +40' },
		{ code: '+44', label: '🇬🇧 +44' },
		{ code: '+45', label: '🇩🇰 +45' },
		{ code: '+46', label: '🇸🇪 +46' },
		{ code: '+47', label: '🇳🇴 +47' },
		{ code: '+48', label: '🇵🇱 +48' },
		{ code: '+351', label: '🇵🇹 +351' },
		{ code: '+352', label: '🇱🇺 +352' },
		{ code: '+353', label: '🇮🇪 +353' },
		{ code: '+354', label: '🇮🇸 +354' },
		{ code: '+358', label: '🇫🇮 +358' },
		{ code: '+359', label: '🇧🇬 +359' },
		{ code: '+370', label: '🇱🇹 +370' },
		{ code: '+371', label: '🇱🇻 +371' },
		{ code: '+372', label: '🇪🇪 +372' },
		{ code: '+380', label: '🇺🇦 +380' },
		{ code: '+381', label: '🇷🇸 +381' },
		{ code: '+385', label: '🇭🇷 +385' },
		{ code: '+386', label: '🇸🇮 +386' },
		{ code: '+389', label: '🇲🇰 +389' },
		{ code: '+420', label: '🇨🇿 +420' },
		{ code: '+421', label: '🇸🇰 +421' },
		{ code: '+61', label: '🇦🇺 +61' },
		{ code: '+62', label: '🇮🇩 +62' },
		{ code: '+63', label: '🇵🇭 +63' },
		{ code: '+64', label: '🇳🇿 +64' },
		{ code: '+65', label: '🇸🇬 +65' },
		{ code: '+66', label: '🇹🇭 +66' },
		{ code: '+81', label: '🇯🇵 +81' },
		{ code: '+82', label: '🇰🇷 +82' },
		{ code: '+86', label: '🇨🇳 +86' },
		{ code: '+90', label: '🇹🇷 +90' },
		{ code: '+91', label: '🇮🇳 +91' },
		{ code: '+92', label: '🇵🇰 +92' },
		{ code: '+94', label: '🇱🇰 +94' },
		{ code: '+98', label: '🇮🇷 +98' },
		{ code: '+212', label: '🇲🇦 +212' },
		{ code: '+213', label: '🇩🇿 +213' },
		{ code: '+216', label: '🇹🇳 +216' },
		{ code: '+234', label: '🇳🇬 +234' },
		{ code: '+254', label: '🇰🇪 +254' },
		{ code: '+60', label: '🇲🇾 +60' },
		{ code: '+852', label: '🇭🇰 +852' },
		{ code: '+886', label: '🇹🇼 +886' },
		{ code: '+966', label: '🇸🇦 +966' },
		{ code: '+971', label: '🇦🇪 +971' },
		{ code: '+972', label: '🇮🇱 +972' },
		{ code: '+974', label: '🇶🇦 +974' },
		{ code: '+962', label: '🇯🇴 +962' },
		{ code: '+961', label: '🇱🇧 +961' },
		{ code: '+58', label: '🇻🇪 +58' },
		{ code: '+55', label: '🇧🇷 +55' },
		{ code: '+54', label: '🇦🇷 +54' },
		{ code: '+56', label: '🇨🇱 +56' },
		{ code: '+57', label: '🇨🇴 +57' },
		{ code: '+51', label: '🇵🇪 +51' },
		{ code: '+52', label: '🇲🇽 +52' },
		{ code: '+506', label: '🇨🇷 +506' },
		{ code: '+502', label: '🇬🇹 +502' },
		{ code: '+504', label: '🇭🇳 +504' },
		{ code: '+507', label: '🇵🇦 +507' },
		{ code: '+595', label: '🇵🇾 +595' },
		{ code: '+598', label: '🇺🇾 +598' },
		{ code: '+375', label: '🇧🇾 +375' },
		{ code: '+994', label: '🇦🇿 +994' },
		{ code: '+995', label: '🇬🇪 +995' },
		{ code: '+998', label: '🇺🇿 +998' },
		{ code: '+7', label: '🇰🇿 +7 (KZ)' },
		{ code: '+964', label: '🇮🇶 +964' },
];
	const laender = ['Schweiz', 'Deutschland', 'Österreich', 'Liechtenstein', '—', 'Afghanistan', 'Albanien', 'Algerien', 'Andorra', 'Angola', 'Argentinien', 'Armenien', 'Australien', 'Aserbaidschan', 'Bahrain', 'Bangladesch', 'Belarus', 'Belgien', 'Bolivien', 'Bosnien und Herzegowina', 'Brasilien', 'Bulgarien', 'Chile', 'China', 'Costa Rica', 'Dänemark', 'Ecuador', 'Estland', 'Finnland', 'Frankreich', 'Georgien', 'Ghana', 'Griechenland', 'Grossbritannien', 'Guatemala', 'Honduras', 'Hong Kong', 'Indien', 'Indonesien', 'Irak', 'Iran', 'Irland', 'Island', 'Israel', 'Italien', 'Japan', 'Jordanien', 'Kasachstan', 'Kenia', 'Kolumbien', 'Kroatien', 'Kuwait', 'Lettland', 'Libanon', 'Litauen', 'Luxemburg', 'Malaysia', 'Malta', 'Marokko', 'Mexiko', 'Moldau', 'Montenegro', 'Neuseeland', 'Niederlande', 'Nigeria', 'Nordmazedonien', 'Norwegen', 'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippinen', 'Polen', 'Portugal', 'Rumänien', 'Russland', 'Saudi-Arabien', 'Schweden', 'Serbien', 'Singapur', 'Slowakei', 'Slowenien', 'Spanien', 'Sri Lanka', 'Südafrika', 'Südkorea', 'Taiwan', 'Thailand', 'Tschechien', 'Tunesien', 'Türkei', 'Ukraine', 'Ungarn', 'Uruguay', 'USA', 'Usbekistan', 'Venezuela', 'Vietnam', 'Zypern'];
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
				if (!el?.value.trim()) errors[f.key] = t('Bitte ausfüllen', lang);
			}
		}
		const emailEl = document.querySelector<HTMLInputElement>('[name="email"]');
		if (emailEl?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
			errors['email'] = t('Bitte gültige E-Mail eingeben', lang);
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
					if (!el?.value.trim()) errors[key] = f.invalid_feedback_text || t('Bitte ausfüllen', lang);
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
			if (f.type === 'tel') {
				const vorwahl = (formData.get('tel_vorwahl') as string) || '';
				const nummer = (formData.get(f.key) as string) || '';
				if (nummer.trim()) {
					checkoutData.data[f.key] = `${vorwahl} ${nummer}`.trim();
					checkoutData.labels[f.key] = f.label;
				}
			} else {
				const val = formData.get(f.key);
				if (typeof val === 'string' && val) {
					checkoutData.data[f.key] = val;
					checkoutData.labels[f.key] = f.label;
				}
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
		// Kommentare
		const kommentare = (formData.get('kommentare') as string | null)?.trim();
		if (kommentare) {
			checkoutData.data['kommentare'] = kommentare;
			checkoutData.labels['kommentare'] = t('Kommentare', lang);
		}

		sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
		const eventParam = data.eventCheckout ? '&event_checkout=true' : '';
		const noChromeParam = $page.url.searchParams.get('no_chrome') === 'true' ? '&no_chrome=true' : '';
		goto(`/beauftragung/zusammenfassung?service=${encodeURIComponent(data.dienstleistung)}${eventParam}${noChromeParam}`);
	}

	$: lang = $page.data.lang || 'de-ch';
	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
</script>

<svelte:head>
	<title>{data.pageTitle || t('Beauftragung', lang)}</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">
<Heading tag="h1">{data.pageTitle || t('Beauftragung', lang)}</Heading>

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
					{t('Rechnungsadresse', lang)}{hasInvoiceErrors ? ' ●' : ''}
				</button>
				<button
					type="button"
					on:click={() => (activeTab = 'weitere')}
					class="px-4 py-2 text-sm font-semibold border-b-2 transition-colors"
					style="border-color: {activeTab === 'weitere' ? pageColor : 'transparent'}; opacity: {activeTab === 'weitere' ? 1 : 0.5};"
				>
					{t('Weitere Angaben', lang)}{hasExtraErrors ? ' ●' : ''}
				</button>
			</div>
		{/if}

		<!-- Rechnungsadresse -->
		<fieldset class:hidden={hasTabs && activeTab !== 'rechnung'}>
			{#if !hasTabs}
				<legend class="text-sm uppercase tracking-wide opacity-60 mb-4">{t('Rechnungsadresse', lang)}</legend>
			{/if}
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
				{#each invoiceFields as f}
					<div class="mb-4 {f.span === 2 ? 'sm:col-span-2' : ''}">
						<label class="block text-base font-bold" for={f.key}>
								{t(f.label, lang)}{f.required ? ' *' : ''}
						</label>
						{#if f.type === 'tel'}
							<div class="flex mt-1">
								<select
									name="tel_vorwahl"
									class="p-2 rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 shrink-0"
									style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px; width: 110px;"
								>
									{#each vorwahlen as v}
										{#if v.code === '—'}<option disabled>──────────</option>{:else}<option value={v.code}>{v.label}</option>{/if}
									{/each}
								</select>
								<input
									id={f.key}
									name={f.key}
									type="tel"
									required={f.required}
									class="p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
									style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px;"
								/>
							</div>
						{:else if f.type === 'select'}
							<select
								id={f.key}
								name={f.key}
								class="mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
								style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px;"
							>
								<option value="">{t('Bitte wählen', lang)}</option>
								{#each laender as l}
									{#if l === '—'}<option disabled>──────────</option>{:else}<option value={l}>{l}</option>{/if}
								{/each}
							</select>
						{:else}
							<input
								id={f.key}
								name={f.key}
								type={f.type}
								required={f.required}
								class="mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
								style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px;"
							/>
						{/if}
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
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
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

		<!-- Kommentare (immer sichtbar) -->
		<div>
			<label class="block text-base font-bold mb-1" for="kommentare">
				{t('Kommentare', lang)}
			</label>
			<textarea
				id="kommentare"
				name="kommentare"
				rows="4"
				class="mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 resize-none"
				style="background-color: {bgColor}; color: {pageColor}; border-bottom-color: {pageColor}; font-size: 18px;"
			></textarea>
		</div>

		<p class="text-xs opacity-60">* {t('Pflichtfelder', lang)}</p>

		<button
			type="submit"
			disabled={isSubmitting}
			class="button-prismic-link inline-block px-6 py-3 font-semibold rounded-full border transition duration-200 ease-in-out"
			style="background-color: {get(theme).pageButtonBgColor}; color: {get(theme).pageButtonColor}; border-color: {get(theme).pageButtonColor};"
		>
			{isSubmitting ? t('Bitte warten…', lang) : (hasTabs && activeTab === 'rechnung') ? t('Weiter', lang) : t('Weiter zur Übersicht', lang)}
		</button>
	</form>
</Bounded>
