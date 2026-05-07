<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import { swipe } from '$lib/actions/swipe';

	export let images: any[] = [];
	export let imageRound: boolean = false;
	export let noRound: boolean = false;
	export let noRoundMobile: boolean = false;
	export let noObjectCover: boolean = false;

	let current = 0;

	function prev() { current = (current - 1 + images.length) % images.length; }
	function next() { current = (current + 1) % images.length; }

	$: roundClass = imageRound ? 'rounded-full' : noRound ? '' : noRoundMobile ? 'md:rounded-3xl' : 'rounded-3xl';
</script>

<div
	class="relative w-full md:h-full overflow-hidden {roundClass}"
	use:swipe={{ onLeft: next, onRight: prev }}
>
	{#each images as img, i}
		<div class="w-full md:h-full transition-opacity duration-500 {i === current ? 'opacity-100' : 'opacity-0 absolute inset-0'}">
			<PrismicImage
				field={img}
				sizes="100vw"
				class="w-full {noObjectCover ? '' : 'md:h-full md:object-cover'} {roundClass}"
			/>
		</div>
	{/each}

	{#if images.length > 1}
		<!-- Pfeile: nur auf Desktop sichtbar -->
		<button
			type="button"
			on:click={prev}
			aria-label="Vorheriges Bild"
			class="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full"
			style="background: rgba(0,0,0,0.35); color: #fff;"
		>‹</button>

		<button
			type="button"
			on:click={next}
			aria-label="Nächstes Bild"
			class="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full"
			style="background: rgba(0,0,0,0.35); color: #fff;"
		>›</button>

		<!-- Dots: immer sichtbar -->
		<div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
			{#each images as _, i}
				<button
					type="button"
					on:click={() => current = i}
					aria-label="Bild {i + 1}"
					class="w-2 h-2 rounded-full transition-opacity"
					style="background: #fff; opacity: {i === current ? 1 : 0.45};"
				/>
			{/each}
		</div>
	{/if}
</div>
