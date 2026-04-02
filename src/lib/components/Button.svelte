<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n/translations';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';
	import { theme } from '$lib/stores/theme';
	import SvgIcons from '$lib/components/SvgIcons.svelte';

	export let link: any = undefined;
	// Für plain-URL-Fälle (kein Prismic-Link-Objekt)
	export let href: string | undefined = undefined;

	// Wir initialisieren text als undefined, um den Default reaktiv zu setzen
	export let text: string | undefined = undefined;

	// Props für Farbüberschreibungen — wenn nicht übergeben, greifen die CSS-Variablen
	export let color: string | undefined = undefined;
	export let bgColor: string | undefined = undefined;
	export let hoverColor: string | undefined = undefined;
	export let hoverBgColor: string | undefined = undefined;
	// CMS-konfigurierter Button-Stil (Name aus Theme › Button-Stile Gruppe)
	export let styleName: string | undefined = undefined;
	// Globaler Button-Stil via CSS-Var-Nummer (Legacy, bleibt für Abwärtskompatibilität)
	export let variant: '1' | '2' | '3' | 'link' | undefined = undefined;
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

	// CMS Button-Stil Lookup
	$: stileEntry = styleName
		? ($theme.buttonStile ?? []).find((s) => s.name === styleName)
		: undefined;
	$: resolvedIcon = stileEntry?.icon || undefined;

	$: resolvedColor =
		color ||
		(styleName
			? `var(--btn-${styleName}-color)`
			: variant
				? `var(--btn-${variant}-color)`
				: 'var(--page-button-color)');
	$: resolvedBgColor =
		bgColor ||
		(styleName
			? `var(--btn-${styleName}-bg)`
			: variant
				? `var(--btn-${variant}-bg)`
				: 'var(--page-button-bg-color)');
	$: resolvedHoverColor =
		hoverColor ||
		(styleName
			? `var(--btn-${styleName}-hover-color)`
			: variant
				? `var(--btn-${variant}-hover-color)`
				: 'var(--page-button-hover-color)');
	$: resolvedHoverBgColor =
		hoverBgColor ||
		(styleName
			? `var(--btn-${styleName}-hover-bg)`
			: variant
				? `var(--btn-${variant}-hover-bg)`
				: 'var(--page-button-hover-bg-color)');

	$: baseClass = `button-prismic-link inline-block ${sizeClass} ${roundedClass} ${mbClass} font-semibold border transition duration-200 ease-in-out focus:outline-none focus:ring-0`;
	$: baseStyle = `background-color: ${resolvedBgColor}; color: ${resolvedColor}; border-color: ${resolvedColor}; --hover-text-color: ${resolvedHoverColor}; --hover-bg-color: ${resolvedHoverBgColor}; --focus-ring-color: ${resolvedColor};`;
</script>

{#if href}
	<a {href} class={baseClass} style={baseStyle}>
		{finalText}{#if resolvedIcon}&nbsp;<SvgIcons
				name={resolvedIcon}
				size="1em"
				color="currentColor"
			/>{/if}
	</a>
{:else if link}
	{#if beauftragungHref}
		<a href={beauftragungHref} class={baseClass} style={baseStyle}>
			{finalText}{#if resolvedIcon}&nbsp;<SvgIcons
					name={resolvedIcon}
					size="1em"
					color="currentColor"
				/>{/if}
		</a>
	{:else}
		<PrismicLink field={link} class={baseClass} style={baseStyle}>
			{finalText}{#if resolvedIcon}&nbsp;<SvgIcons
					name={resolvedIcon}
					size="1em"
					color="currentColor"
				/>{/if}
		</PrismicLink>
	{/if}
{:else}
	<button type="submit" class={baseClass} style={baseStyle} disabled={$$props.disabled} on:click>
		{finalText}{#if resolvedIcon}&nbsp;<SvgIcons
				name={resolvedIcon}
				size="1em"
				color="currentColor"
			/>{/if}
	</button>
{/if}

<style>
	:global(.button-prismic-link:hover) {
		color: var(--hover-text-color) !important;
		background-color: var(--hover-bg-color) !important;
		border-color: var(--hover-text-color) !important;
	}
</style>
