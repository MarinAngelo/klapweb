<script lang="ts">
	export let checked = false;
	export let disabled = false;
	export let name: string | undefined = undefined;
	export let value: string | undefined = undefined;
	export let id: string | undefined = undefined;
</script>

<input
	type="checkbox"
	bind:checked
	{disabled}
	{name}
	{value}
	{id}
	class="checkbox"
/>

<style>
	.checkbox {
		appearance: none;
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		min-width: 20px;
		border: 2px solid var(--page-color, currentColor);
		background-color: var(--page-bg-color, transparent);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.checkbox:checked {
		background-color: var(--page-color, currentColor);
	}

	.checkbox:checked::after {
		content: '';
		display: block;
		width: 5px;
		height: 9px;
		border: 2px solid var(--page-bg-color, white);
		border-top: none;
		border-left: none;
		transform: rotate(45deg) translate(-1px, -1px);
	}

	.checkbox:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
