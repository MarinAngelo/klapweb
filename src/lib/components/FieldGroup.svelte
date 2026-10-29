<script lang="ts">
	export let label = '';
	export let forId: string | undefined = undefined;
</script>

<div class="field-group">
	{#if label}
		<label class="field-group-label" for={forId}>{label}</label>
	{/if}
	<div class="field-group-control">
		<slot />
	</div>
</div>

<style>
	.field-group {
		display: flex;
		width: 100%;
		flex-direction: column;
	}

	.field-group-label {
		display: block;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.5rem;
	}

	.field-group-control {
		min-height: 2.5rem;
	}

	.field-group-control :global(input),
	.field-group-control :global(.select-dropdown-trigger) {
		box-sizing: border-box;
		height: 2.5rem;
	}
</style>
