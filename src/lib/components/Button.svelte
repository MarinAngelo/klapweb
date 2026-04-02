<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n/translations';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';

	export let link: any = undefined;
	// Für plain-URL-Fälle (kein Prismic-Link-Objekt)
	export let href: string | undefined = undefined;

	// Wir initialisieren text als undefined, um den Default reaktiv zu setzen
	export let text: string | undefined = undefined;

	// Props für Farbüberschreibungen — wenn nicht übergeben, greifen die CSS-Variablen
	export let color: string | undefined;
	export let bgColor: string | undefined;
	export let hoverColor: string | undefined;
	export let hoverBgColor: string | undefined;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	// Runde Ecken: true = rounded-full (Standard), false = leicht abgerundet
	export let rounded: boolean = true;
	// Abstand unten (mb-6 Standard, false = kein Abstand)
	export let mb: boolean = true;

	$: sizeClass =
		size === 'sm'
			? 'px-3 py-1.5 text-sm'
			: size === 'lg'
				? 'px-10 py-4 text-lg'
				: 'px-6 py-3 text-base';

	$: roundedClass = rounded ? 'rounded-full' : 'rounded';
	$: mbClass = mb ? 'mb-6' : '';

	// Ermittle aktuelle Sprache für den Standard-Text
	$: lang = $page.data.lang || 'de-ch';
	$: finalText = text || t('Mehr erfahren', lang);

	$: beauftragungHref = getBeauftragunHref(link, $page.params.uid);

	$: resolvedColor = color || 'var(--page-button-color)';
	$: resolvedBgColor = bgColor || 'var(--page-button-bg-color)';
	$: resolvedHoverColor = hoverColor || 'var(--page-button-hover-color)';
	$: resolvedHoverBgColor = hoverBgColor || 'var(--page-button-hover-bg-color)';

	$: baseClass = `button-prismic-link inline-block ${sizeClass} ${roundedClass} ${mbClass} font-semibold border transition duration-200 ease-in-out focus:outline-none focus:ring-0`;
	$: baseStyle = `background-color: ${resolvedBgColor}; color: ${resolvedColor}; border-color: ${resolvedColor}; --hover-text-color: ${resolvedHoverColor}; --hover-bg-color: ${resolvedHoverBgColor}; --focus-ring-color: ${resolvedColor};`;
</script>

{#if href}
	<a {href} class={baseClass} style={baseStyle}>
		{finalText}
	</a>
{:else if link}
	{#if beauftragungHref}
		<a href={beauftragungHref} class={baseClass} style={baseStyle}>
			{finalText}
		</a>
	{:else}
		<PrismicLink field={link} class={baseClass} style={baseStyle}>
			{finalText}
		</PrismicLink>
	{/if}
{:else}
	<button type="submit" class={baseClass} style={baseStyle} disabled={$$props.disabled} on:click>
		{finalText}
	</button>
{/if}

<style>
	:global(.button-prismic-link:hover) {
		color: var(--hover-text-color) !important;
		background-color: var(--hover-bg-color) !important;
		border-color: var(--hover-text-color) !important;
	}
</style>
