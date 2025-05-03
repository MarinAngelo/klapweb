<script lang="ts">
	import clsx from 'clsx';

	export let tag = 'section';
	// Wenn nicht gesetzt, dann wird der Standardwert 'base' verwendet
	export let yPadding: 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top' = 'base-top';
	export let collapsible = true;
</script>

<svelte:element
	this={tag}
	data-collapsible={collapsible}
	{...$$restProps}
	class={clsx(
		'px-6',
		yPadding === 'none' && 'py-0',
		// Abstand oben und unten
		yPadding === 'sm' && 'py-8 md:py-10',
		yPadding === 'base' && 'py-20 md:py-28',
		yPadding === 'lg' && 'py-32 md:py-48',
		// Abstand nur oben
		yPadding === 'sm-top' && 'pt-8 md:pt-10',
		yPadding === 'base-top' && 'pt-20 md:pt-28',
		yPadding === 'lg-top' && 'pt-32 md:pt-48',
		$$props.class
	)}
>
	<div class="mx-auto w-full max-w-6xl"><slot /></div>
</svelte:element>
