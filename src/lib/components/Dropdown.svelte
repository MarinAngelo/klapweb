<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte'; // Import der neuen Komponente

	// Props definieren
	export let item;
	export let subItems;
	export let headerColor;
	export let headerBgColor;
	export let headerLinkColor; // Wird aktuell nicht verwendet im Snippet
	export let headerLinkHoverColor;

</script>

<div class="relative group">
	<DropdownButton {item} {headerColor} {headerLinkColor}/>

	<div
		class="absolute left-0 mt-0 hidden w-48 shadow-lg group-hover:block z-10 rounded py-1"
		style="background-color: {headerBgColor};"
	>
		{#each subItems as dropdownItem}
			<div style="--custom-hover: {headerLinkHoverColor}; color: {headerLinkColor}">
				<PrismicLink
					field={dropdownItem.link}
					class="block px-4 py-2 text-sm"
					
				>
					<PrismicText field={dropdownItem.label} />
				</PrismicLink>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Korrigierte dynamische Hover-Farbe */

	/* * Wir zielen auf das Element mit der Klasse 'block' (die der Link hat),
     * wenn es gehovert wird (:hover).
     * Dann setzen wir die background-color unter Verwendung unserer Variable.
     * Mit !important stellen wir sicher, dass diese Regel Vorrang vor
     * der Tailwind-Regel hat, die durch 'hover:bg-gray-100' generiert wird.
     */
	.block:hover {
		background-color: red !important;
	}

	/* Sicherstellen, dass die Textfarbe im Normalzustand passt (optional) */
	.block {
		/* Hier könntest du die normale Textfarbe setzen, falls nötig */
		/* color: var(--normal-text-color); */
	}
</style>
