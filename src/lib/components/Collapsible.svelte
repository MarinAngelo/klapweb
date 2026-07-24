<script lang="ts">
	export let isOpen = false;
	export let onToggle: () => void = () => {};
</script>

<div class="collapsible">
	<div
		class="collapsible-trigger"
		on:click={onToggle}
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
		role="button"
		tabindex="0"
		aria-expanded={isOpen}
	>
		<slot name="trigger" />
		<span class="collapsible-indicator">{isOpen ? '▼' : '▶'}</span>
	</div>
	{#if isOpen}
		<div class="collapsible-content">
			<slot />
		</div>
	{/if}
</div>

<style>
	.collapsible-trigger {
		appearance: none;
		background: none !important;
		border: none !important;
		outline: none !important;
		box-shadow: none !important;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0;
		font: inherit;
		color: inherit;
		transition: opacity 0.2s;
	}

	.collapsible-trigger:hover {
		opacity: 0.8;
	}

	.collapsible-trigger:focus,
	.collapsible-trigger:focus-visible,
	.collapsible-trigger:active {
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
	}

	.collapsible-indicator {
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.collapsible-content {
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
