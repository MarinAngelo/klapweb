<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let link: any;
	export let text: string = 'Mehr erfahren';

	// Props für Farbüberschreibungen
	export let color: string | undefined;
	export let bgColor: string | undefined;
	export let hoverColor: string | undefined;
	export let hoverBgColor: string | undefined;
	console.log('hoverBgColor', hoverBgColor);

	const { pageLinkColor, pageLinkHoverColor, buttonBgColor } = get(theme);

	$: resolvedColor = color ?? pageLinkColor;
	$: resolvedBgColor = bgColor ?? buttonBgColor ?? 'transparent';
	$: resolvedHoverColor = hoverColor ?? pageLinkHoverColor;
	$: resolvedHoverBgColor = hoverBgColor ?? 'red';
</script>

<PrismicLink
	field={link}
	class="button-prismic-link inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6
           border transition duration-200 ease-in-out"
	style={`
        background-color: ${resolvedBgColor};
        color: ${resolvedColor};
        border-color: ${resolvedColor};
        --hover-bg-color: ${resolvedHoverBgColor};
        --hover-text-color: ${resolvedHoverColor};
        --focus-ring-color: ${resolvedColor};
    `}
>
	{text}
</PrismicLink>
