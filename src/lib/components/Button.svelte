<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n/translations';
	import { getBeauftragunHref } from '$lib/utils/beauftragungHref';

	export let link: any;

	// Wir initialisieren text als undefined, um den Default reaktiv zu setzen
	export let text: string | undefined = undefined;

	// Props für Farbüberschreibungen
	export let color: string | undefined;
	export let bgColor: string | undefined;
	export let hoverColor: string | undefined;
	export let hoverBgColor: string | undefined;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	$: sizeClass =
		size === 'sm'
			? 'px-3 py-1.5 text-sm'
			: size === 'lg'
				? 'px-10 py-4 text-lg'
				: 'px-6 py-3 text-base';

	// Ermittle aktuelle Sprache für den Standard-Text
	$: lang = $page.data.lang || 'de-ch';
	$: finalText = text || t('Mehr erfahren', lang);

	$: beauftragungHref = getBeauftragunHref(link, $page.params.uid);

	$: resolvedColor = color ?? $theme.pageButtonColor;
	$: resolvedBgColor = bgColor ?? $theme.pageButtonBgColor;
	$: resolvedHoverColor = hoverColor ?? $theme.pageButtonHoverColor;
	$: resolvedHoverBgColor = hoverBgColor ?? $theme.pageButtonHoverBgColor;
</script>

{#if link}
	{#if beauftragungHref}
		<a
			href={beauftragungHref}
			class="button-prismic-link inline-block {sizeClass} font-semibold rounded-full mb-6 border transition duration-200 ease-in-out focus:outline-none focus:ring-0"
			style={`
                background-color: ${resolvedBgColor};
                color: ${resolvedColor};
                border-color: ${resolvedColor};
                --hover-text-color: ${resolvedHoverColor};
                --hover-bg-color: ${resolvedHoverBgColor};
                --focus-ring-color: ${resolvedColor};
            `}
		>
			{finalText}
		</a>
	{:else}
		<PrismicLink
			field={link}
			class="button-prismic-link inline-block {sizeClass} font-semibold rounded-full mb-6 border transition duration-200 ease-in-out focus:outline-none focus:ring-0"
			style={`
                background-color: ${resolvedBgColor};
                color: ${resolvedColor};
                border-color: ${resolvedColor};
                --hover-text-color: ${resolvedHoverColor};
                --hover-bg-color: ${resolvedHoverBgColor};
                --focus-ring-color: ${resolvedColor};
            `}
		>
			{finalText}
		</PrismicLink>
	{/if}
{:else}
	<button
		type="submit"
		class="button-prismic-link inline-block {sizeClass} font-semibold rounded-full mb-6 border transition duration-200 ease-in-out focus:outline-none focus:ring-0"
		style={`
            background-color: ${resolvedBgColor};
            color: ${resolvedColor};
            border-color: ${resolvedColor};
            --hover-text-color: ${resolvedHoverColor};
            --hover-bg-color: ${resolvedHoverBgColor};
            --focus-ring-color: ${resolvedColor};
        `}
		disabled={$$props.disabled}
		on:click
	>
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
