<script lang="ts">
	// File-Auswahl als Button im Projektstil (wie Aktions-Buttons)
	export let id: string;
	export let label: string;
	export let files: FileList | undefined = undefined;
	export let accept = '*/*';
	export let required = false;
	export let disabled = false;

	$: fileName = files?.[0]?.name ?? '';
</script>

<div class="flex flex-col gap-1">
	<span class="block text-sm font-medium">{label}{required ? ' *' : ''}</span>
	<label
		for={id}
		class="px-4 py-1.5 text-sm rounded self-start cursor-pointer"
		style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {disabled
			? 0.5
			: 1};"
	>
		{fileName || label}
	</label>
	<input {id} type="file" bind:files {accept} {required} {disabled} class="sr-only" on:change />
</div>
