<script lang="ts">
	import { TIMEZONES } from '$lib/utils/timezones';
	import { theme } from '$lib/stores/theme';
	import { shadeColor } from '$lib/utils/color';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { _ } from '$lib/stores/i18n';

	export let field: {
		field_name: string | null;
		field_type: string | null;
		required: boolean;
		options?: string | null; // Optionen als String, durch Kommas getrennt
		placeholder?: string | null;
		maxlength?: number | null;
		min?: number | null;
		max?: number | null;
		'invalid_feedback-text'?: string | null;
		invalid_feedback_text?: string | null;
	};
	// compact=true: full border + text-sm styling (matches hardcoded invoice fields)
	export let compact = false;
	// inline=true: Label und Input nebeneinander statt übereinander
	export let inline = false;
	export let showLabel = true;
	export let inputId: string | undefined = undefined;

	// Technischer Schlüssel: Typ hat Vorrang, sonst normalisierter Label
	const typeKeys: Record<string, string> = {
		'E-Mail': 'email',
		Textbereich: 'message',
		Suche: 'search',
		Land: 'land',
		Termin: 'termin',
		Zeitzone: 'zeitzone'
	};
	$: key =
		typeKeys[field.field_type ?? ''] ||
		(field.field_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') ||
		'';

	// Mapping von benutzerfreundlichen Typen zu HTML-Typen
	const typeMapping: Record<string, string> = {
		Ankreuzfeld: 'checkbox',
		Einzelauswahl: 'radio',
		Auswahlliste: 'select',
		Textfeld: 'text',
		Suche: 'search',
		Code: 'code',
		Zahl: 'number',
		'E-Mail': 'email',
		Textbereich: 'textarea',
		Telefon: 'tel',
		Land: 'select-country',
		Termin: 'select-termin',
		Zeitzone: 'select-zeitzone'
	};

	// Termin-Auswahl: verfügbare Slots laden
	export let refreshKey: number = 0;
	interface AvailableTermin {
		id: string;
		label: string;
		titel?: string;
		uhrzeit?: string;
		endzeit?: string;
		sessionLaenge?: number | null;
		arbeitstagLabel?: string;
	}
	let termine: AvailableTermin[] = [];
	let termineLoading = false;
	let termineError = false;
	let selectedTermin = '';
	let selectedWorkday = '';
	let selectedTime = '';

	$: termineByWorkday = termine.reduce<Record<string, Record<string, AvailableTermin[]>>>(
		(groups, termin) => {
			const workday = termin.arbeitstagLabel || termin.label.split(' – ')[0] || 'Termin';
			const time = termin.uhrzeit || 'Ganztägig';
			(groups[workday] ??= {})[time] ??= [];
			groups[workday][time].push(termin);
			return groups;
		},
		{}
	);
	$: selectedWorkdaySlots = termineByWorkday[selectedWorkday] ?? {};
	$: selectedTimeTermine = selectedWorkdaySlots[selectedTime] ?? [];

	function chooseWorkday(workday: string) {
		selectedWorkday = workday;
		selectedTime = '';
		selectedTermin = '';
	}

	function chooseTime(time: string) {
		selectedTime = time;
		selectedTermin = '';
	}

	const countries = [
		'Afghanistan',
		'Ägypten',
		'Albanien',
		'Algerien',
		'Andorra',
		'Angola',
		'Antigua und Barbuda',
		'Äquatorialguinea',
		'Argentinien',
		'Armenien',
		'Aserbaidschan',
		'Äthiopien',
		'Australien',
		'Bahamas',
		'Bahrain',
		'Bangladesch',
		'Barbados',
		'Belarus',
		'Belgien',
		'Belize',
		'Benin',
		'Bhutan',
		'Bolivien',
		'Bosnien und Herzegowina',
		'Botswana',
		'Brasilien',
		'Brunei',
		'Bulgarien',
		'Burkina Faso',
		'Burundi',
		'Chile',
		'China',
		'Costa Rica',
		'Dänemark',
		'Deutschland',
		'Dominica',
		'Dominikanische Republik',
		'Dschibuti',
		'Ecuador',
		'El Salvador',
		'Elfenbeinküste',
		'Eritrea',
		'Estland',
		'Eswatini',
		'Fidschi',
		'Finnland',
		'Frankreich',
		'Gabun',
		'Gambia',
		'Georgien',
		'Ghana',
		'Grenada',
		'Griechenland',
		'Guatemala',
		'Guinea',
		'Guinea-Bissau',
		'Guyana',
		'Haiti',
		'Honduras',
		'Indien',
		'Indonesien',
		'Irak',
		'Iran',
		'Irland',
		'Island',
		'Israel',
		'Italien',
		'Jamaika',
		'Japan',
		'Jemen',
		'Jordanien',
		'Kambodscha',
		'Kamerun',
		'Kanada',
		'Kap Verde',
		'Kasachstan',
		'Katar',
		'Kenia',
		'Kirgisistan',
		'Kiribati',
		'Kolumbien',
		'Komoren',
		'Kongo (Dem. Rep.)',
		'Kongo (Rep.)',
		'Kosovo',
		'Kroatien',
		'Kuba',
		'Kuwait',
		'Laos',
		'Lesotho',
		'Lettland',
		'Libanon',
		'Liberia',
		'Libyen',
		'Liechtenstein',
		'Litauen',
		'Luxemburg',
		'Madagaskar',
		'Malawi',
		'Malaysia',
		'Malediven',
		'Mali',
		'Malta',
		'Marokko',
		'Marshallinseln',
		'Mauretanien',
		'Mauritius',
		'Mexiko',
		'Mikronesien',
		'Moldawien',
		'Monaco',
		'Mongolei',
		'Montenegro',
		'Mosambik',
		'Myanmar',
		'Namibia',
		'Nauru',
		'Nepal',
		'Neuseeland',
		'Nicaragua',
		'Niederlande',
		'Niger',
		'Nigeria',
		'Nordkorea',
		'Nordmazedonien',
		'Norwegen',
		'Oman',
		'Österreich',
		'Pakistan',
		'Palau',
		'Panama',
		'Papua-Neuguinea',
		'Paraguay',
		'Peru',
		'Philippinen',
		'Polen',
		'Portugal',
		'Ruanda',
		'Rumänien',
		'Russland',
		'Salomonen',
		'Sambia',
		'Samoa',
		'San Marino',
		'São Tomé und Príncipe',
		'Saudi-Arabien',
		'Schweden',
		'Schweiz',
		'Senegal',
		'Serbien',
		'Seychellen',
		'Sierra Leone',
		'Simbabwe',
		'Singapur',
		'Slowakei',
		'Slowenien',
		'Somalia',
		'Spanien',
		'Sri Lanka',
		'St. Kitts und Nevis',
		'St. Lucia',
		'St. Vincent und die Grenadinen',
		'Sudan',
		'Südafrika',
		'Südkorea',
		'Südsudan',
		'Suriname',
		'Syrien',
		'Tadschikistan',
		'Tansania',
		'Thailand',
		'Timor-Leste',
		'Togo',
		'Tonga',
		'Trinidad und Tobago',
		'Tschad',
		'Tschechien',
		'Tunesien',
		'Türkei',
		'Turkmenistan',
		'Tuvalu',
		'Uganda',
		'Ukraine',
		'Ungarn',
		'Uruguay',
		'Usbekistan',
		'Vanuatu',
		'Vatikanstadt',
		'Venezuela',
		'Vereinigte Arabische Emirate',
		'Vereinigte Staaten',
		'Vereinigtes Königreich',
		'Vietnam',
		'Zentralafrikanische Republik',
		'Zypern'
	];

	// HTML-Typ basierend auf dem Mapping (reaktiv: aktualisiert sich wenn field.field_type ändert)
	$: htmlType = typeMapping[field.field_type ?? ''] || field.field_type || 'text';

	async function loadTermine(_key: number) {
		void _key;
		termineLoading = true;
		termineError = false;
		selectedTermin = '';
		selectedWorkday = '';
		selectedTime = '';
		try {
			const r = await fetch('/api/termine');
			termine = await r.json();
		} catch {
			termineError = true;
		} finally {
			termineLoading = false;
		}
	}

	$: if (field.field_type === 'Termin' && typeof window !== 'undefined') loadTermine(refreshKey);

	// Telefon: Vorwahl + Nummer
	const countryPrefixes = [
		{ prefix: '+41', label: '🇨🇭 +41' },
		{ prefix: '+49', label: '🇩🇪 +49' },
		{ prefix: '+43', label: '🇦🇹 +43' },
		{ prefix: '+33', label: '🇫🇷 +33' },
		{ prefix: '+39', label: '🇮🇹 +39' },
		{ prefix: '+44', label: '🇬🇧 +44' },
		{ prefix: '+1', label: '🇺🇸 +1' },
		{ prefix: '+34', label: '🇪🇸 +34' },
		{ prefix: '+31', label: '🇳🇱 +31' },
		{ prefix: '+32', label: '🇧🇪 +32' },
		{ prefix: '+352', label: '🇱🇺 +352' },
		{ prefix: '+48', label: '🇵🇱 +48' },
		{ prefix: '+351', label: '🇵🇹 +351' },
		{ prefix: '+420', label: '🇨🇿 +420' },
		{ prefix: '+7', label: '🇷🇺 +7' },
		{ prefix: '+90', label: '🇹🇷 +90' },
		{ prefix: '+86', label: '🇨🇳 +86' },
		{ prefix: '+81', label: '🇯🇵 +81' },
		{ prefix: '+82', label: '🇰🇷 +82' },
		{ prefix: '+91', label: '🇮🇳 +91' },
		{ prefix: '+55', label: '🇧🇷 +55' },
		{ prefix: '+52', label: '🇲🇽 +52' },
		{ prefix: '+54', label: '🇦🇷 +54' },
		{ prefix: '+61', label: '🇦🇺 +61' },
		{ prefix: '+64', label: '🇳🇿 +64' },
		{ prefix: '+27', label: '🇿🇦 +27' },
		{ prefix: '+971', label: '🇦🇪 +971' },
		{ prefix: '+966', label: '🇸🇦 +966' },
		{ prefix: '+20', label: '🇪🇬 +20' }
	];
	let prefix = '+41';
	let localNumber = '';
	export let value: string | number = '';
	let textValue = '';
	let numberValue: number | null = typeof value === 'number' ? value : null;
	$: if (
		htmlType === 'text' ||
		htmlType === 'search' ||
		htmlType === 'code' ||
		htmlType === 'email'
	)
		value = textValue;
	$: if (htmlType === 'number') value = numberValue ?? '';
	$: if (htmlType === 'tel') value = localNumber ? `${prefix} ${localNumber}` : '';

	$: selectOptionBg = shadeColor($theme.pageBgColor || '#ffffff', -30);

	function handleCodeInput(e: Event) {
		textValue = (e.target as HTMLInputElement).value.toUpperCase();
	}

	function sanitizeTel(e: Event) {
		const input = e.target as HTMLInputElement;
		const clean = input.value.replace(/[^0-9 \-()]/g, '');
		if (clean !== input.value) {
			input.value = clean;
			localNumber = clean;
		}
	}
</script>

<div class={inline ? 'w-full contents' : 'mb-4'}>
	<!-- Label -->
	{#if htmlType !== 'checkbox' && showLabel}
		<label
			for={key}
			class={inline
				? 'text-base font-bold flex-shrink-0'
				: compact
					? 'block text-sm font-semibold mb-1'
					: 'block text-base font-bold'}
		>
			{field.field_name ?? ''}{field.required ? ' *' : ''}
		</label>
	{/if}

	<div class={inline ? 'flex-1' : ''}>
		{#if htmlType === 'search'}
			<input
				type="search"
				id={inputId ?? key}
				name={inputId ?? key}
				bind:value={textValue}
				required={field.required}
				placeholder={field.placeholder ?? ''}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:input
				on:blur
				on:change
			/>
		{:else if htmlType === 'text'}
			<input
				type="text"
				id={inputId ?? key}
				name={inputId ?? key}
				bind:value={textValue}
				required={field.required}
				placeholder={field.placeholder ?? ''}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:input
				on:blur
				on:change
			/>
		{:else if htmlType === 'number'}
			<input
				type="number"
				id={inputId ?? key}
				name={inputId ?? key}
				bind:value={numberValue}
				required={field.required}
				min={field.min ?? undefined}
				max={field.max ?? undefined}
				placeholder={field.placeholder ?? ''}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:blur
				on:change
			/>
		{:else if htmlType === 'code'}
			<input
				type="text"
				id={inputId ?? key}
				name={inputId ?? key}
				bind:value={textValue}
				required={field.required}
				placeholder={field.placeholder ?? ''}
				maxlength={field.maxlength ?? undefined}
				autocomplete="off"
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none uppercase tracking-widest font-mono code-input'
					: 'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm uppercase tracking-widest font-mono code-input'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:input={handleCodeInput}
				on:blur
				on:change
			/>
		{:else if htmlType === 'email'}
			<input
				type="email"
				id={inputId ?? key}
				name={inputId ?? key}
				bind:value={textValue}
				required={field.required}
				placeholder={field.placeholder ?? ''}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:blur
				on:change
			/>
		{:else if htmlType === 'tel'}
			{#if compact}
				<div
					class="flex items-center border"
					style="border-color: color-mix(in srgb, var(--page-color) 27%, transparent);"
				>
					<select
						bind:value={prefix}
						class="p-2 shrink-0 focus:outline-none bg-transparent"
						style="color: var(--page-color); border: none;"
					>
						{#each countryPrefixes as cp}
							<option value={cp.prefix}>{cp.label}</option>
						{/each}
					</select>
					<input
						type="tel"
						id={key}
						bind:value={localNumber}
						required={field.required}
						placeholder={field.placeholder ?? ''}
						pattern={'[0-9 \\-\\(\\)]{4,25}'}
						inputmode="numeric"
						class="py-2 pr-3 flex-1 focus:outline-none bg-transparent"
						style="color: var(--page-color); border: none;"
						on:input={sanitizeTel}
						on:blur
						on:change
					/>
				</div>
			{:else}
				<div
					class="flex items-end mt-1 border-b focus-within:border-b-2"
					style="border-bottom-color: var(--page-color);"
				>
					<select
						bind:value={prefix}
						class="input p-2 shrink-0 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
						style="background-color: var(--page-bg-color); color: var(--page-color); border: none;"
					>
						{#each countryPrefixes as cp}
							<option value={cp.prefix}>{cp.label}</option>
						{/each}
					</select>
					<input
						type="tel"
						id={key}
						bind:value={localNumber}
						required={field.required}
						placeholder={field.placeholder ?? ''}
						pattern={'[0-9 \\-\\(\\)]{4,25}'}
						inputmode="numeric"
						class="input p-2 flex-1 focus:outline-none focus:ring-0"
						style="background-color: var(--page-bg-color); color: var(--page-color); border: none;"
						on:input={sanitizeTel}
						on:blur
						on:change
					/>
				</div>
			{/if}
			<input type="hidden" name={key} value={localNumber ? `${prefix} ${localNumber}` : ''} />
		{:else if htmlType === 'textarea'}
			{#if compact}
				<textarea
					id={key}
					name={key}
					required={field.required}
					placeholder={field.placeholder ?? ''}
					rows="4"
					class="w-full border px-3 py-2 bg-transparent focus:outline-none"
					style="border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);"
					on:blur
					on:change
				></textarea>
			{:else}
				<div
					class="border-b focus-within:border-b-2"
					style="border-bottom-color: var(--page-color);"
				>
					<textarea
						id={key}
						name={key}
						required={field.required}
						placeholder={field.placeholder ?? ''}
						rows="4"
						class="input mt-1 p-2 block w-full rounded-md focus:outline-none focus:ring-0"
						style="background-color: var(--page-bg-color); color: var(--page-color);"
						on:blur
						on:change
					></textarea>
				</div>
			{/if}
		{:else if htmlType === 'select'}
			<select
				id={inputId ?? key}
				name={inputId ?? key}
				required={field.required}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-md border-b focus:border-b-2 focus:outline-none focus:ring-0'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:blur
				on:change
			>
				<option value="" disabled selected>Bitte auswählen</option>
				{#each field.options?.split(',') || [] as option}
					<option
						value={option?.trim() ?? ''}
						style="background-color: {selectOptionBg}; color: var(--page-color);"
						>{option?.trim() ?? ''}</option
					>
				{/each}
			</select>
		{:else if htmlType === 'radio'}
			<div class="flex flex-col gap-2">
				{#each field.options?.split(',') || [] as option}
					<label class="inline-flex items-center">
						<input
							type="radio"
							name={key}
							value={option?.trim() ?? ''}
							required={field.required}
							class="form-radio text-indigo-600 focus:ring-indigo-500"
						/>
						<span class="ml-2">{option?.trim() ?? ''}</span>
					</label>
				{/each}
			</div>
		{:else if htmlType === 'select-country'}
			<select
				id={inputId ?? key}
				name={inputId ?? key}
				required={field.required}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-md border-b focus:border-b-2 focus:outline-none focus:ring-0'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:blur
				on:change
			>
				<option value="" disabled selected>Bitte auswählen</option>
				{#each countries as country}
					<option
						value={country}
						style="background-color: {selectOptionBg}; color: var(--page-color);">{country}</option
					>
				{/each}
			</select>
		{:else if htmlType === 'checkbox'}
			<div class="flex items-center">
				<label class="flex items-center" for={key}>
					<Checkbox id={key} name={key} checked={field.required} value="Ausgewählt" />
					<span class="ml-2 {compact ? 'text-sm font-semibold' : 'text-base font-medium'}"
						>{field.field_name ?? ''}</span
					>
				</label>
			</div>
		{:else if htmlType === 'select-termin'}
			{#if termineLoading}
				<p class="text-sm opacity-60">Termine werden geladen…</p>
			{:else if termineError}
				<p class="text-sm text-red-500">Termine konnten nicht geladen werden.</p>
			{:else if termine.length === 0}
				<p class="text-sm opacity-60">Keine verfügbaren Termine.</p>
			{:else}
				<div class="termin-selection" role="radiogroup" aria-label={field.field_name ?? 'Termin'}>
					{#if !selectedWorkday}
						<section class="termin-step">
							<h4>{$_('Tag wählen')}</h4>
							<div class="termin-day-options">
								{#each Object.keys(termineByWorkday) as workday}
									<button
										type="button"
										class="termin-day-option"
										on:click={() => chooseWorkday(workday)}
									>
										{workday}
									</button>
								{/each}
							</div>
						</section>
					{:else if !selectedTime}
						<section class="termin-step">
							<div class="termin-step-heading">
								<h4>{selectedWorkday}</h4>
								<button type="button" class="termin-back" on:click={() => chooseWorkday('')}
									>{$_('Tag ändern')}</button
								>
							</div>
							<h5 class="termin-step-title">{$_('Zeit wählen')}</h5>
							<div class="termin-time-options">
								{#each Object.entries(selectedWorkdaySlots) as [time, slotTermine]}
									<button
										type="button"
										class="termin-time-option"
										on:click={() => chooseTime(time)}
									>
										<strong
											>{time}{slotTermine[0]?.endzeit ? `–${slotTermine[0].endzeit}` : ''}</strong
										>
										<span>{slotTermine.length} {$_('Angebote')}</span>
									</button>
								{/each}
							</div>
						</section>
					{:else}
						<section class="termin-step">
							<div class="termin-step-heading">
								<h4>{selectedWorkday}</h4>
								<button type="button" class="termin-back" on:click={() => chooseTime('')}
									>{$_('Zeit ändern')}</button
								>
							</div>
							<h5 class="termin-step-title">
								{selectedTime}{selectedTimeTermine[0]?.endzeit
									? `–${selectedTimeTermine[0].endzeit}`
									: ''}
							</h5>
							<div class="termin-options">
								{#each selectedTimeTermine as t}
									<label class:selected={selectedTermin === t.id} class="termin-option">
										<input
											type="radio"
											id={`${key}-${t.id}`}
											name={key}
											value={t.id}
											bind:group={selectedTermin}
											required={field.required}
											on:blur
											on:change
										/>
										<span class="termin-option-content">
											<strong>{t.titel ?? t.label}</strong>
											{#if t.sessionLaenge}<small>{t.sessionLaenge} Minuten</small>{/if}
										</span>
									</label>
								{/each}
							</div>
						</section>
					{/if}
				</div>
			{/if}
		{:else if htmlType === 'select-zeitzone'}
			<select
				id={key}
				name={key}
				required={field.required}
				class={compact
					? 'w-full border px-3 py-2 bg-transparent focus:outline-none'
					: 'input mt-1 p-2 block w-full rounded-md border-b focus:border-b-2 focus:outline-none focus:ring-0'}
				style={compact
					? 'border-color: color-mix(in srgb, var(--page-color) 27%, transparent); color: var(--page-color);'
					: 'background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);'}
				on:blur
				on:change
			>
				<option value="">Zeitzone wählen</option>
				{#each TIMEZONES as tz}
					<option
						value={tz.value}
						style="background-color: {selectOptionBg}; color: var(--page-color);">{tz.label}</option
					>
				{/each}
			</select>
		{/if}
		{#if field['invalid_feedback-text']}
			<p class="text-red-500 text-sm mt-1">{field['invalid_feedback-text']}</p>
		{/if}
	</div>
</div>

<!-- Alle globalen styles hier definieren-->
<style>
	.input {
		font-size: 18px;
		line-height: 1.5;
	}

	.termin-selection {
		display: grid;
		gap: 1.25rem;
		margin-top: 0.75rem;
	}

	.termin-step {
		display: grid;
		gap: 0.75rem;
	}

	.termin-step-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.termin-step-heading h4,
	.termin-step-title {
		margin: 0;
	}

	.termin-day-options,
	.termin-time-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
		gap: 0.625rem;
	}

	.termin-day-option,
	.termin-time-option {
		border: 1px solid color-mix(in srgb, var(--page-color) 28%, transparent);
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, var(--page-bg-color) 94%, var(--page-color));
		color: var(--page-color);
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.termin-day-option:hover,
	.termin-time-option:hover {
		border-color: var(--page-color);
		background: color-mix(in srgb, var(--page-color) 12%, var(--page-bg-color));
		transform: translateY(-1px);
	}

	.termin-day-option:focus-visible,
	.termin-time-option:focus-visible,
	.termin-back:focus-visible {
		outline: 2px solid var(--page-color);
		outline-offset: 2px;
	}

	.termin-time-option {
		display: grid;
		gap: 0.25rem;
	}

	.termin-time-option span {
		font-size: 0.8rem;
		opacity: 0.65;
	}

	.termin-back {
		border: 0;
		padding: 0;
		background: none;
		color: var(--page-color);
		font-size: 0.85rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.termin-day {
		margin: 0;
	}

	.termin-day h4 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 700;
	}

	.termin-time-slots {
		display: grid;
		gap: 0.875rem;
	}

	.termin-time-slot h5 {
		margin: 0 0 0.375rem;
		font-size: 0.95rem;
		font-style: normal;
		font-weight: 700;
	}

	.termin-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr));
		gap: 0.625rem;
	}

	.termin-option {
		position: relative;
		display: flex;
		min-height: 4.5rem;
		cursor: pointer;
		align-items: center;
		gap: 0.75rem;
		border: 1px solid color-mix(in srgb, var(--page-color) 28%, transparent);
		padding: 0.75rem 0.875rem;
		background: color-mix(in srgb, var(--page-bg-color) 94%, var(--page-color));
		transition:
			border-color 0.15s ease,
			background-color 0.15s ease,
			transform 0.15s ease;
	}

	.termin-option:hover {
		border-color: var(--page-color);
		transform: translateY(-1px);
	}

	.termin-option:focus-within {
		outline: 2px solid var(--page-color);
		outline-offset: 2px;
	}

	.termin-option.selected {
		border-color: var(--page-color);
		background: color-mix(in srgb, var(--page-color) 12%, var(--page-bg-color));
	}

	.termin-option input {
		width: 1rem;
		height: 1rem;
		margin: 0;
		accent-color: var(--page-color);
		flex: 0 0 auto;
	}

	.termin-option-content {
		display: grid;
		gap: 0.125rem;
	}

	.termin-option-content strong {
		font-size: 0.95rem;
		line-height: 1.25;
	}

	.termin-option-content span {
		font-size: 0.95rem;
		line-height: 1.25;
	}

	.termin-option-content small {
		font-size: 0.8rem;
		opacity: 0.65;
	}

	.code-input::placeholder {
		color: color-mix(in srgb, var(--page-color) 35%, transparent);
	}
</style>
