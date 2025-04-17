<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';

	export let link: any; // Der Link, der an PrismicLink übergeben wird
	export let text: string = 'Mehr erfahren'; // Standardtext für den Button
</script>

<PrismicLink
	field={link}
	class="text-xs sm:text-sm inline-block px-4 py-2 font-semibold rounded-full hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
	style="--button-bg-color: {get(theme).pageBgColor}; --button-text-color: {get(theme)
		.pageColor}; border: 1px solid var(--button-text-color);"
>
	{text}
</PrismicLink>
