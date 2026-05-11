<script lang="ts">
	import { onMount } from 'svelte';

	export let src: string;
	export let alt: string = '';

	let open = false;

	function close() { open = false; }

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	$: if (typeof document !== 'undefined') {
		document.body.style.overflow = open ? 'hidden' : '';
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="lightbox-trigger" on:click={() => (open = true)}>
	<slot />
</div>

{#if open}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="lightbox-backdrop"
		on:click={close}
	>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div on:click|stopPropagation>
			<img {src} {alt} class="lightbox-img" />
		</div>
		<button
			type="button"
			class="lightbox-close"
			on:click={close}
			aria-label="Schliessen"
		>×</button>
	</div>
{/if}

<style>
	.lightbox-trigger {
		cursor: zoom-in;
		display: contents;
	}

	.lightbox-backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.92);
		animation: lb-in 0.2s ease;
	}

	.lightbox-img {
		max-width: min(90vw, 1600px);
		max-height: 90vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
		animation: lb-zoom 0.2s ease;
	}

	.lightbox-close {
		position: absolute;
		top: 1rem;
		right: 1.25rem;
		color: #fff;
		font-size: 2.5rem;
		line-height: 1;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.lightbox-close:hover {
		opacity: 1;
	}

	@keyframes lb-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes lb-zoom {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
