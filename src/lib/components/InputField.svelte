<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	export let field: {
		field_name: string | null;
		field_type: string;
		required: boolean;
		'invalid_feedback-text'?: string | null;
	};
</script>

<div class="mb-4">
	<label for={field.field_name} class="block text-sm font-medium">
		{field.field_name}
	</label>
	{#if field.field_type === 'text' || field.field_type === 'email'}
		<input
			type={field.field_type}
			id={field.field_name}
			name={field.field_name}
			required={field.required}
			class="mt-1 p-2 block w-full rounded-none border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor}; border-bottom-color: {get(theme).pageColor};"
		/>
	{:else if field.field_type === 'textarea'}
    <div class="border-b-2" style="border-bottom-color: {get(theme).pageColor};">
		<textarea
			id={field.field_name}
			name={field.field_name}
			required={field.required}
			rows="4"
			class="mt-1 p-2 block w-full rounded-md sm:text-sm"
            			style="background-color: {get(theme).pageBgColor}; color: {get(theme)
				.pageColor};"
		></textarea>
    </div>
	{/if}
	{#if field['invalid_feedback-text']}
		<p class="text-red-500 text-sm mt-1">{field['invalid_feedback-text']}</p>
	{/if}
</div>
