<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte';
	import { createEventDispatcher } from 'svelte';

	// Props definieren
	export let item;
	export let subItems;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkHoverColor; // Dynamische Hover-Farbe
	export let currentPath;

	// Event-Dispatcher erstellen
	const dispatch = createEventDispatcher();
</script>

<div
	class="relative group"
	style="--hover-bg-color: {headerLinkHoverColor}; --normal-text-color: {headerLinkColor};"
>
	<DropdownButton {item} {headerLinkColor} />

	<ul
		class="absolute left-0 mt-0 hidden w-48 shadow-lg group-hover:block z-40 rounded py-1"
		style="background-color: {headerBgColor};"
	>
		{#each subItems as dropdownItem, index}
			<li
				class="{currentPath === dropdownItem.link.url ? 'underline' : ''} {index === 0
					? 'mt-11'
					: ''} p-2 font-semibold tracking-tight block"
			>
				<PrismicLink field={dropdownItem.link} on:click={() => dispatch('click')}>
					<PrismicText field={dropdownItem.label} />
				</PrismicLink>
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Dynamische Hover-Farbe */
	.block:hover {
		background-color: var(--hover-bg-color, red) !important; /* Fallback auf rot */
	}

	/* Dynamische Textfarbe */
	.block {
		color: var(--normal-text-color, black); /* Fallback auf schwarz */
	}
</style>
