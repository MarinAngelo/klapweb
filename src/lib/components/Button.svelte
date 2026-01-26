<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';

	export let link: any;
	export let text: string = 'Mehr erfahren';

	// Props für Farbüberschreibungen
	export let color: string | undefined;
	export let bgColor: string | undefined;
	export let hoverColor: string | undefined;
	export let hoverBgColor: string | undefined;

	$: resolvedColor = color ?? $theme.pageButtonColor;
	$: resolvedBgColor = bgColor ?? $theme.pageButtonBgColor;
	$: resolvedHoverColor = hoverColor ?? $theme.pageButtonHoverColor;
	$: resolvedHoverBgColor = hoverBgColor ?? $theme.pageButtonHoverBgColor;
</script>

{#if link}
	<PrismicLink
		field={link}
		class="button-prismic-link inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6 border transition duration-200 ease-in-out"
		style={`
			background-color: ${resolvedBgColor};
			color: ${resolvedColor};
			border-color: ${resolvedColor};
			--hover-text-color: ${resolvedHoverColor};
			--hover-bg-color: ${resolvedHoverBgColor};
			--focus-ring-color: ${resolvedColor};
		`}
	>
		{text}
	</PrismicLink>
{:else}
	<button
		type="submit"
		class="button-prismic-link inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6 border transition duration-200 ease-in-out"
		style={`
			background-color: ${resolvedBgColor};
			color: ${resolvedColor};
			border-color: ${resolvedColor};
			--hover-text-color: ${resolvedHoverColor};
			--hover-bg-color: ${resolvedHoverBgColor};
			--focus-ring-color: ${resolvedColor};
		`}
		disabled={$$props.disabled}
	>
		{text}
	</button>
{/if}
