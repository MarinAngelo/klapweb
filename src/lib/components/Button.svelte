<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let link: any;
	export let text: string = 'Mehr erfahren';

	// Props für Farbüberschreibungen
	export let color: string | undefined;
	export let bgColor: string | undefined;
	export let hoverTextColor: string | undefined;
	export let hoverBgColor: string | undefined;

	const {
		pageLinkColor,
		pageLinkHoverColorText,
		pageLinkHoverColorBg,
		buttonBgColor
	} = get(theme);

	$: resolvedColor = color ?? pageLinkColor;
	$: resolvedBgColor = bgColor ?? buttonBgColor ?? 'transparent';
	$: resolvedHoverTextColor = hoverTextColor ?? pageLinkHoverColorText;
	$: resolvedHoverBgColor = hoverBgColor ?? pageLinkHoverColorBg;
</script>

<PrismicLink
	field={link}
	class="inline-block px-4 py-2 font-semibold rounded-full text-xs sm:text-sm mb-6
	       border transition duration-200 ease-in-out
	       hover:bg-current hover:text-white focus:ring-current"
	style={`
		background-color: ${resolvedBgColor};
		color: ${resolvedColor};
		border-color: ${resolvedColor};
		--hover-bg-color: ${resolvedHoverBgColor};
		--hover-text-color: ${resolvedHoverTextColor};
		--focus-ring-color: ${resolvedColor};
	`}
>
	{text}
</PrismicLink>
