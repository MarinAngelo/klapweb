<script lang="ts">
	import { theme } from '$lib/stores/theme';
	export let html: string;

	$: bg = $theme.pageColor || '#1a1a1a';
	$: color = $theme.pageBgColor || '#fff';

	const id = `tooltip-${Math.random().toString(36).slice(2, 8)}`;
</script>

<span class="tooltip-wrap">
	<button
		type="button"
		class="icon"
		aria-describedby={id}
		aria-label="Mehr Informationen"
	>ⓘ</button>
	<span
		{id}
		role="tooltip"
		class="tip"
		style="background: {bg}; color: {color};"
	>{@html html}</span>
</span>

<style>
	.tooltip-wrap {
		position: relative;
		display: inline-block;
	}
	.icon {
		opacity: 0.6;
		font-size: 0.9em;
		font-weight: bold;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		color: inherit;
		font-family: inherit;
	}
	.tip {
		display: none;
		position: absolute;
		left: 0;
		bottom: 100%;
		margin-bottom: 0;
		padding-bottom: 6px; /* gap bridged via padding, not margin */
		z-index: 10;
		width: 320px;
		max-width: calc(100vw - 2rem);
		padding-top: 0.5rem;
		padding-left: 0.75rem;
		padding-right: 0.75rem;
		border-radius: 0.25rem;
		font-size: 14px;
		font-weight: normal;
		line-height: 1.4;
		pointer-events: auto;
		white-space: normal;
	}
	@media (max-width: 767px) {
		.tooltip-wrap {
			position: static;
		}
		.tip {
			left: 0;
			right: 0;
			width: auto;
			max-width: none;
		}
	}
	.tooltip-wrap:hover .tip,
	.tooltip-wrap:focus-within .tip {
		display: block;
	}
	.icon:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
		border-radius: 2px;
	}
	/* Force color and font-size — prevents inheritance from card parent */
	.tip :global(*) {
		color: inherit;
		font-size: 14px;
	}
	.tip :global(a) {
		color: var(--page-link-color, currentColor);
		text-decoration: underline;
	}
	.tip :global(a:hover) {
		color: var(--page-link-hover-color, currentColor);
	}
	.tip :global(p) {
		margin: 0;
	}
</style>
