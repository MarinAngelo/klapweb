<script lang="ts">
	import clsx from 'clsx';

	export let tag = 'section';
	export let yPadding: 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top' = 'base-top';
	export let collapsible = true;

	// Neu: bind:this von außen durchgereicht
	export let elementRef: HTMLElement | null = null;
</script>

<svelte:element
	this={tag}
	bind:this={elementRef}
	data-collapsible={collapsible}
	{...$$restProps}
	class={clsx(
		'px-6',
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
	<div class="mx-auto w-full max-w-6xl"><slot /></div>
</svelte:element>