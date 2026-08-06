<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { shadeColor } from '$lib/utils/color';

	export let value: string = '';
	export let options: (string | { value: string; label: string; disabled?: boolean })[] = [];
	export let name: string | undefined = undefined;
	export let id: string | undefined = undefined;
	export let required = false;
	export let fullWidth = false;
	export let placeholder: string | undefined = undefined;

	$: optionBg = shadeColor($theme.pageBgColor || '#ffffff', -30);
</script>

<select
	{name}
	{id}
	{required}
	bind:value
	class="p-2 border-b focus:border-b-2 focus:outline-none focus:ring-0 {fullWidth
		? 'block w-full'
		: ''}"
	style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
	on:change
	on:blur
>
	{#if placeholder}
		<option value="" disabled selected>{placeholder}</option>
	{/if}
	{#each options as opt}
		{#if typeof opt === 'string'}
			<option value={opt} style="background-color: {optionBg}; color: var(--page-color);"
				>{opt}</option
			>
		{:else if opt.disabled}
			<option disabled>──────────</option>
		{:else}
			<option value={opt.value} style="background-color: {optionBg}; color: var(--page-color);"
				>{opt.label}</option
			>
		{/if}
	{/each}
</select>
