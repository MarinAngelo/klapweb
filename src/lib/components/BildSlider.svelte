<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import { swipe } from '$lib/actions/swipe';

	export let images: any[] = [];
	export let imageRound: boolean = false;
	export let noRound: boolean = false;
	export let noRoundMobile: boolean = false;
	export let noObjectCover: boolean = false;
	export let lightbox: boolean = false;

	let current = 0;
	let dialog: HTMLDialogElement;

	function prev() { current = (current - 1 + images.length) % images.length; }
	function next() { current = (current + 1) % images.length; }

	function openLightbox() {
		if (!dialog) return;
		dialog.showModal();
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		if (!dialog) return;
		dialog.close();
		document.body.style.overflow = '';
	}

	function onBackdropClick(e: MouseEvent) {
		if (e.target === dialog) closeLightbox();
	}

	$: roundClass = imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl';
	$: currentImage = images[current];
</script>

<div
	class="relative w-full md:h-full overflow-hidden {roundClass}"
	use:swipe={{ onLeft: next, onRight: prev }}
>
	{#each images as img, i}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="w-full md:h-full transition-opacity duration-500 {i === current ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}"
			class:lb-trigger={lightbox}
			on:click={lightbox ? openLightbox : undefined}
		>
			<PrismicImage
				field={img}
				sizes="100vw"
				class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {roundClass}"
			/>
		</div>
	{/each}

	{#if images.length > 1}
		<button
			type="button"
			on:click|stopPropagation={prev}
			aria-label="Vorheriges Bild"
			class="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full"
			style="background: rgba(0,0,0,0.35); color: #fff;"
		>‹</button>

		<button
			type="button"
			on:click|stopPropagation={next}
			aria-label="Nächstes Bild"
			class="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full"
			style="background: rgba(0,0,0,0.35); color: #fff;"
		>›</button>

		<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
			{#each images as _, i}
				<button
					type="button"
					on:click|stopPropagation={() => current = i}
					aria-label="Bild {i + 1}"
					class="w-2 h-2 rounded-full transition-opacity"
					style="background: #fff; opacity: {i === current ? 1 : 0.45};"
				/>
			{/each}
		</div>
	{/if}
</div>

{#if lightbox && currentImage}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<dialog bind:this={dialog} on:click={onBackdropClick} on:cancel={closeLightbox}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="lb-content" on:click|stopPropagation>
			<img src={currentImage.url ?? ''} alt={currentImage.alt ?? ''} class="lb-img" />
		</div>
		<button type="button" class="lb-close" on:click={closeLightbox} aria-label="Schliessen">×</button>
	</dialog>
{/if}

<style>
	.lb-trigger {
		cursor: zoom-in;
	}

	dialog {
		padding: 0;
		border: none;
		background: transparent;
		max-width: 100vw;
		max-height: 100vh;
		overflow: visible;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.92);
		animation: lb-in 0.2s ease;
	}

	.lb-img {
		max-width: min(90vw, 1600px);
		max-height: 90vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6);
		display: block;
		animation: lb-zoom 0.2s ease;
	}

	.lb-close {
		position: fixed;
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

	.lb-close:hover { opacity: 1; }

	@keyframes lb-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes lb-zoom {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
