<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import Dropdown from './Dropdown.svelte';
	// Props definieren
	export let navigation;
	export let headerColor; // Wird für die Textfarbe verwendet
	export let headerBgColor; // Wird für den Hintergrund des Dropdowns verwendet
	export let headerLinkColor; // Wird für die Textfarbe der Links verwendet
	export let headerLinkHoverColor; // Wird für die Hover-Farbe der Links verwendet

	// Helper-Funktion, um die Unterpunkte für ein gegebenes Dropdown-Hauptitem zu finden
	// PASSE DIESE FUNKTION AN, falls die Beziehung zwischen Haupt- und Unterpunkt anders ist!
	function getSubItems(triggerItem, allLinks) {
		if (!triggerItem || !allLinks) {
			return [];
		}
		// Annahme: Das 'sub_link'-Feld des Unterpunkts entspricht dem 'label'-Feld des Hauptpunkts.
		const triggerLabel = triggerItem.label?.[0]?.text; // Sicherer Zugriff auf den Label-Text
		if (!triggerLabel) {
			return [];
		}
		return allLinks.filter(
			(subItem) =>
				subItem.sub_link && // Es muss ein Unterpunkt sein
				subItem.sub_link === triggerLabel && // Es muss zum aktuellen Trigger passen
				subItem !== triggerItem // Es darf nicht der Trigger selbst sein
		);
	}

	console.log('🚀 ~ navigation data links:', navigation.data?.links);
</script>

<ul class="flex flex-wrap gap-6 md:gap-10">
	{#each navigation.data?.links as item}
		{#if item.dropdown_link === true}
			{@const subItems = getSubItems(item, navigation.data.links)}

			{#if subItems.length > 0}
				<!-- Verwendung der Dropdown-Komponente -->
				<Dropdown
					{item}
					{subItems}
					{headerColor}
					{headerBgColor}
					{headerLinkColor}
					{headerLinkHoverColor}
				/>
			{:else if item.link?.url}
				<li
					class="font-semibold tracking-tight"
					style="color: {headerLinkColor};"
				>
					<PrismicLink field={item.link}>
						<PrismicText field={item.label} />
					</PrismicLink>
				</li>
			{/if}
		{:else if item.sub_link}
			{@const _skip = true}
		{:else if item.link?.url}
			<li
				class="font-semibold tracking-tight"
				style="color: {headerLinkColor};"
			>
				<PrismicLink field={item.link}>
					<PrismicText field={item.label} />
				</PrismicLink>
			</li>
		{/if}
	{/each}
</ul>
