<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	console.log('Theme values:', get(theme));

	export let link: any; // Der Link, der an PrismicLink übergeben wird
	export let text: string = 'Mehr erfahren'; // Standardtext für den Button
</script>

<PrismicLink
	field={link}
	class="text-xs sm:text-sm inline-block px-4 py-2 font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
	style="--button-bg-color: {get(theme).pageBgColor}; --button-text-color: {get(theme)
		.pageColor}; --page-link-color: {get(theme).pageLinkColor}; --page-link-hover-color: {get(theme).pageLinkHoverColor}; --page-link-active-color: {get(
		theme).pageLinkActiveColor}; --page-link-visited-color: {get(theme).pageLinkVisitedColor}; --button-bg-opacity: {get(
		theme).headerBgOpacity}; border: 1px solid var(--button-text-color);"
>
	{text}
</PrismicLink>
