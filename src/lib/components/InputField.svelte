<script lang="ts">
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
            class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
    {:else if field.field_type === 'textarea'}
        <textarea
            id={field.field_name}
            name={field.field_name}
            required={field.required}
            rows="4"
            class="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        ></textarea>
    {/if}
    {#if field['invalid_feedback-text']}
        <p class="text-red-500 text-sm mt-1">{field['invalid_feedback-text']}</p>
    {/if}
</div>