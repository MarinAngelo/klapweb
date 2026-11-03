<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from '$lib/stores/i18n';
	import SvgIcons from '$lib/components/SvgIcons.svelte';

	let visible = false;
	let threshold = 0;
	let button: HTMLButtonElement | undefined;
	let frame = 0;
	const GAP_PX = 12;

	function updateVisibility() {
		threshold = window.innerHeight * 3;
		visible = window.scrollY >= threshold;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(keepAboveFooter);
	}

	/**
	 * Footer (incl. top curve) or the legal bar of landing pages in view → the button moves up
	 * so it never covers the footer links. Direct style update, no reactive state (scroll).
	 */
	function keepAboveFooter() {
		if (!button) return;
		const footer = document.querySelector<HTMLElement>('.footer-shell, footer.footer-legal-bar');
		const curve = footer?.querySelector<SVGElement>('.footer-top-curve');
		const top = Math.min(
			footer?.getBoundingClientRect().top ?? Infinity,
			curve?.getBoundingClientRect().top ?? Infinity
		);
		const overlap = window.innerHeight - top;
		button.style.bottom = overlap > 0 ? `${overlap + GAP_PX}px` : '';
	}

	function scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	}

	onMount(() => {
		updateVisibility();
		window.addEventListener('scroll', updateVisibility, { passive: true });
		window.addEventListener('resize', updateVisibility);

		return () => {
			window.removeEventListener('scroll', updateVisibility);
			window.removeEventListener('resize', updateVisibility);
			cancelAnimationFrame(frame);
		};
	});
</script>

{#if visible}
	<button
		bind:this={button}
		type="button"
		class="page-up-button"
		on:click={scrollToTop}
		aria-label={$_('Nach oben')}
		title={$_('Nach oben')}
	>
		<SvgIcons name="up" size="1.25em" />
	</button>
{/if}

<style>
	.page-up-button {
		/* centred so it doesn't collide with the chat widget (bottom right) */
		position: fixed;
		left: 50%;
		bottom: 1rem;
		z-index: 45;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--header-color);
		border-radius: 9999px;
		background-color: var(--header-bg-color);
		color: var(--header-color);
		box-shadow: 0 2px 8px rgb(0 0 0 / 18%);
		cursor: pointer;
		transform: translateX(-50%);
		font-size: 1.5rem;
		line-height: 1;
		transition:
			bottom 120ms ease-out,
			background-color 160ms ease,
			color 160ms ease,
			transform 160ms ease;
	}

	.page-up-button:hover {
		background-color: var(--header-color);
		color: var(--header-bg-color);
		transform: translate(-50%, -2px);
	}

	.page-up-button:focus-visible {
		outline: 2px solid var(--header-link-hover-color);
		outline-offset: 3px;
	}

	@media (max-width: 767px) {
		.page-up-button {
			bottom: 0.75rem;
			width: 2.5rem;
			height: 2.5rem;
		}
	}
</style>
