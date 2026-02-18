<script lang="ts">
	import clsx from 'clsx';
	import { isMobile } from '$lib/stores/isMobile';
	import { reveal, type RevealOptions } from '$lib/actions/reveal';

	export let tag = 'section';
	export let yPadding: 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top' =
		'base-top';
	export let collapsible = true;
	export let specialLayout = false;

	export let animate: boolean = false;
	export let animationOptions: RevealOptions = {};

	export let elementRef: HTMLElement | null = null;

	// Wir bereiten die Optionen vor: Wenn animate false ist,
	// zwingen wir die direction auf 'none'.
	$: finalOptions = animate ? { ...animationOptions } : { direction: 'none' as const };
	// Falls keine duration gesetzt ist, Standardwert 800ms
	if (finalOptions && typeof finalOptions.duration !== 'number') {
		finalOptions.duration = 800;
	}
</script>

<svelte:element
	this={tag}
	bind:this={elementRef}
	use:reveal={finalOptions}
	data-collapsible={collapsible}
	{...$$restProps}
	class={clsx(
		'px-6',
		specialLayout && isMobile && 'px-0',
		yPadding === 'none' && 'py-0',
		yPadding === 'sm' && 'py-8 md:py-10',
		yPadding === 'base' && 'py-20 md:py-28',
		yPadding === 'lg' && 'py-32 md:py-48',
		yPadding === 'sm-top' && 'pt-8 md:pt-10',
		yPadding === 'base-top' && 'pt-20 md:pt-28',
		yPadding === 'lg-top' && 'pt-32 md:pt-48',
		$$props.class
	)}
>
	<div class="mx-auto w-full max-w-6xl relative overflow-visible">
		<slot />
	</div>
</svelte:element>
