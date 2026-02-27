<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let field: {
		field_name: string | null;
		field_type: string | null;
		required: boolean;
		options?: string | null; // Optionen als String, durch Kommas getrennt
		'invalid_feedback-text'?: string | null;
		invalid_feedback_text?: string | null;
	};

	// Technischer Schlüssel: Typ hat Vorrang, sonst normalisierter Label
	const typeKeys: Record<string, string> = { 'E-Mail': 'email', Textbereich: 'message' };
	$: key = typeKeys[field.field_type ?? ''] || (field.field_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') || '';

	// Mapping von benutzerfreundlichen Typen zu HTML-Typen
	const typeMapping: Record<string, string> = {
		Ankreuzfeld: 'checkbox',
		Einzelauswahl: 'radio',
		Auswahlliste: 'select',
		Textfeld: 'text',
		'E-Mail': 'email',
		Textbereich: 'textarea',
		Telefon: 'tel'
	};

	// HTML-Typ basierend auf dem Mapping
	const htmlType = typeMapping[field.field_type ?? ''] || field.field_type || 'text';

	// Telefon: Vorwahl + Nummer
	const countryPrefixes = [
		{ prefix: '+41', label: '🇨🇭 +41' },
		{ prefix: '+49', label: '🇩🇪 +49' },
		{ prefix: '+43', label: '🇦🇹 +43' },
		{ prefix: '+33', label: '🇫🇷 +33' },
		{ prefix: '+39', label: '🇮🇹 +39' },
		{ prefix: '+44', label: '🇬🇧 +44' },
		{ prefix: '+1',  label: '🇺🇸 +1' },
		{ prefix: '+34', label: '🇪🇸 +34' },
		{ prefix: '+31', label: '🇳🇱 +31' },
		{ prefix: '+32', label: '🇧🇪 +32' },
		{ prefix: '+352', label: '🇱🇺 +352' },
		{ prefix: '+48', label: '🇵🇱 +48' },
		{ prefix: '+351', label: '🇵🇹 +351' },
		{ prefix: '+420', label: '🇨🇿 +420' },
		{ prefix: '+7',  label: '🇷🇺 +7' },
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
</script>

<div class="mb-4">
	<!-- Hier Labels für alle Felder-->
	{#if htmlType !== 'checkbox'}
		<label for={key} class="block text-base font-bold">
			{field.field_name ?? ''}{field.required ? ' *' : ''}
		</label>
	{/if}
	{#if htmlType === 'text' || htmlType === 'email'}
		<input
			type={htmlType}
			id={key}
			name={key}
			required={field.required}
			class="input mt-1 p-2 block w-full rounded-none border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor}; border-bottom-color: {get(theme).pageColor};"
			on:blur
		/>
	{:else if htmlType === 'tel'}
		<div
			class="flex items-center mt-1 border-b-2"
			style="border-bottom-color: {get(theme).pageColor};"
		>
			<select
				bind:value={prefix}
				class="input p-2 shrink-0 focus:outline-none focus:ring-0"
				style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor}; border: none;"
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
				class="input p-2 flex-1 focus:outline-none focus:ring-0"
				style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor}; border: none;"
				on:blur
			/>
		</div>
		<!-- Kombinierter Wert für Formular-Übermittlung; leer wenn keine Nummer eingegeben -->
		<input type="hidden" name={key} value={localNumber ? `${prefix} ${localNumber}` : ''} />
	{:else if htmlType === 'textarea'}
		<div class="border-b-2" style="border-bottom-color: {get(theme).pageColor};">
			<textarea
				id={key}
				name={key}
				required={field.required}
				rows="4"
				class="input mt-1 p-2 block w-full rounded-md focus:outline-none focus:ring-0"
				style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor};"
				on:blur
			></textarea>
		</div>
	{:else if htmlType === 'select'}
		<select
			id={key}
			name={key}
			required={field.required}
			class="input mt-1 p-2 block w-full rounded-md border-b-2 focus:outline-none focus:ring-0"
			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor}; border-bottom-color: {get(theme).pageColor};"
			on:blur
		>
			<!-- Leere Option hinzufügen -->
			<option value="" disabled selected>Bitte auswählen</option>
			{#each field.options?.split(',') || [] as option}
				<option value={option?.trim() ?? ''}>{option?.trim() ?? ''}</option>
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
	{:else if htmlType === 'checkbox'}
		<div class="flex items-center">
			<label class="flex items-center">
				<input
					type="checkbox"
					name={key}
					checked={field.required}
					value="Ausgewählt"
					class="h-5 w-5 cursor-pointer"
					style="width: 20px; height: 20px;"
				/>
				<!-- Sichtbarer Text bleibt nur im <span> -->
				<span class="ml-2 text-base font-medium">{field.field_name ?? ''}</span>
			</label>
		</div>
	{/if}
	{#if field['invalid_feedback-text']}
		<p class="text-red-500 text-sm mt-1">{field['invalid_feedback-text']}</p>
	{/if}
</div>

<!-- Alle globalen styles hier definieren-->
<style>
	.input {
		font-size: 18px;
	}
</style>
