<script lang="ts">
	import { PrismicText } from '@prismicio/svelte';
	import SvgIcons from './SvgIcons.svelte';

	export let item;
	export let headerLinkColor;
	export let headerLinkFontSize;
	export let onClick = () => {};
	export let isOpen = false;
</script>

<button
	type="button"
	on:click={onClick}
	class="font-semibold tracking-tight inline-flex items-center"
	style="color: {headerLinkColor}; font-size: {headerLinkFontSize}rem;"
	aria-haspopup="true"
	aria-expanded={isOpen}
>
	<PrismicText field={item.label} />
	<SvgIcons name="down" size="1rem" color={headerLinkColor} />
</button>
