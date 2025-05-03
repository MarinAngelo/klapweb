<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let field: {
		field_name: string | null;
		field_type: string;
		required: boolean;
		options?: string; // Optionen als String, durch Kommas getrennt
		'invalid_feedback-text'?: string | null;
	};

	// Mapping von benutzerfreundlichen Typen zu HTML-Typen
	const typeMapping: Record<string, string> = {
		Ankreuzfeld: 'checkbox',
		Einzelauswahl: 'radio',
		Auswahlliste: 'select',
		Textfeld: 'text',
		'E-Mail': 'email',
		Textbereich: 'textarea'
	};

	// HTML-Typ basierend auf dem Mapping
	const htmlType = typeMapping[field.field_type] || field.field_type;

</script>

<div class="mb-4">
	<!-- Hier Labels für alle Felder-->
	{#if htmlType !== 'checkbox'}
		<label for={field.field_name} class="block text-base font-medium">
			{field.field_name}
		</label>
	{/if}
	{#if htmlType === 'text' || htmlType === 'email'}
		<input
			type={field.field_type}
			id={field.field_name}
			name={field.field_name}
			required={field.required}
			class="input mt-1 p-2 block w-full rounded-none border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor}; border-bottom-color: {get(theme).pageColor};"
		/>
	{:else if htmlType === 'textarea'}
		<div class="border-b-2" style="border-bottom-color: {get(theme).pageColor};">
			<textarea
				id={field.field_name}
				name={field.field_name}
				required={field.required}
				rows="4"
				class="input mt-1 p-2 block w-full rounded-md"
				style="background-color: {get(theme).pageBgColor}; color: {get(theme).pageColor};"
			></textarea>
		</div>
	{:else if htmlType === 'select'}
		<select
			id={field.field_name}
			name={field.field_name}
			required={field.required}
			class="input mt-1 p-2 block w-full rounded-md border-b-2 focus:outline-none focus:ring-0"
			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor}; border-bottom-color: {get(theme).pageColor};"
		>
			<!-- Leere Option hinzufügen -->
			<option value="" disabled selected>Bitte auswählen</option>
			{#each field.options?.split(',') || [] as option}
				<option value={option.trim()}>{option.trim()}</option>
			{/each}
		</select>
	{:else if htmlType === 'radio'}
		<div class="flex flex-col gap-2">
			{#each field.options?.split(',') || [] as option}
				<label class="inline-flex items-center">
					<input
						type="radio"
						name={field.field_name}
						value={option.trim()}
						required={field.required}
						class="form-radio text-indigo-600 focus:ring-indigo-500"
					/>
					<span class="ml-2">{option.trim()}</span>
				</label>
			{/each}
		</div>
	{:else if htmlType === 'checkbox'}
		<div class="flex items-center">
			<label class="flex items-center">
				<input
					type="checkbox"
					name={field.field_name}
					checked={field.required}
					value="Ausgewählt"
					class="h-5 w-5 cursor-pointer"
					style="width: 20px; height: 20px;"
				/>
				<!-- Sichtbarer Text bleibt nur im <span> -->
				<span class="ml-2 text-base font-medium">{field.field_name}</span>
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
