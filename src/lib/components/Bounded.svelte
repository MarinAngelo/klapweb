<script lang="ts">
	import clsx from 'clsx';
	import { isMobile } from '$lib/stores/isMobile';
	import { reveal, type RevealOptions } from '$lib/actions/reveal';

	export let tag = 'section';
	export let yPadding: 'none' | 'sm' | 'sm-top' | 'base' | 'base-top' | 'lg' | 'lg-top' =
		'base-top';
	/** CMS-gesteuerte Abstände (überschreibt yPadding für die jeweilige Achse) */
	export let paddingTop: string | undefined = undefined;
	export let paddingBottom: string | undefined = undefined;
	/** Fertige Tailwind-Klassen (überschreibt paddingTop/paddingBottom komplett) */
	export let paddingTopClass: string | undefined = undefined;
	export let paddingBottomClass: string | undefined = undefined;
	export let collapsible = true;
	export let specialLayout = false;

	export let animate: boolean = false;
	export let animationOptions: RevealOptions = {};

	export let fullWidth: boolean = false;
	export let noPadding: boolean = false;
	export let fullHeight: boolean = false;
	export let elementRef: HTMLElement | null = null;

	// CMS-Label → Tailwind-Klassen
	const ptMap: Record<string, string> = {
		Kein: 'pt-0',
		Klein: 'pt-8 md:pt-10',
		Mittel: 'pt-20 md:pt-28',
		Gross: 'pt-32 md:pt-48'
	};
	const pbMap: Record<string, string> = {
		Kein: 'pb-0',
		Klein: 'pb-8 md:pb-10',
		Mittel: 'pb-20 md:pb-28',
		Gross: 'pb-32 md:pb-48'
	};

	// yPadding → Einzelachsen (Rückwärtskompatibilität)
	const yTop: Record<string, string> = {
		none: '',
		sm: 'pt-8 md:pt-10',
		'sm-top': 'pt-8 md:pt-10',
		base: 'pt-20 md:pt-28',
		'base-top': 'pt-20 md:pt-28',
		lg: 'pt-32 md:pt-48',
		'lg-top': 'pt-32 md:pt-48'
	};
	const yBottom: Record<string, string> = {
		none: 'pb-0',
		sm: 'md:pb-10',
		'sm-top': 'pb-0',
		base: 'md:pb-28',
		'base-top': 'pb-0',
		lg: 'md:pb-48',
		'lg-top': 'pb-0'
	};

	$: topClass = paddingTopClass !== undefined ? paddingTopClass : (paddingTop != null ? (ptMap[paddingTop] ?? '') : (yTop[yPadding] ?? ''));
	$: bottomClass = paddingBottomClass !== undefined ? paddingBottomClass : (paddingBottom != null ? (pbMap[paddingBottom] ?? '') : (yBottom[yPadding] ?? ''));

	$: finalOptions = animate
		? { duration: 2000, delay: 100, ...animationOptions }
		: { direction: 'none' as const };
</script>

<svelte:element
	this={tag}
	bind:this={elementRef}
	use:reveal={finalOptions}
	data-collapsible={collapsible}
	{...$$restProps}
	class={clsx(
		!noPadding && 'px-6',
		specialLayout && isMobile && 'px-0',
		topClass,
		bottomClass,
		fullHeight && 'flex flex-col',
		$$props.class
	)}
>
	<div
		class="mx-auto w-full relative overflow-visible"
		class:flex-1={fullHeight}
		class:flex={fullHeight}
		class:flex-col={fullHeight}
		style:max-width={!fullWidth ? 'var(--container-max-width, 72rem)' : undefined}
	>
		<slot />
	</div>
</svelte:element>
