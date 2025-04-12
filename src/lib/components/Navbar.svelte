<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import Dropdown from './Dropdown.svelte';

	// Props definieren
	export let navigation;
	export let headerColor; // Wird für die Textfarbe verwendet
	export let headerBgColor; // Wird für den Hintergrund des Dropdowns verwendet
	export let headerLinkColor; // Wird für die Textfarbe der Links verwendet
	export let headerLinkHoverColor; // Wird für die Hover-Farbe der Links verwendet
	export let currentPath; // Aktueller Pfadname, um den aktiven Link zu bestimmen
	export let settings;

	// Zustand für das Hamburger-Menü
	let isMenuOpen = false;

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

<nav class="flex items-center justify-between flex-wrap p-6">
	<!-- Logo -->
	<div class="flex items-center flex-shrink-0 mr-6">
		<a href="/" class="text-xl font-semibold tracking-tight" style="color: {headerColor};">
			<PrismicText field={settings.data.siteTitle} />
		</a>
	</div>

	<!-- Hamburger Button -->
	<div class="block lg:hidden">
		<button
			class="flex items-center px-3 py-2 border rounded"
			on:click={() => (isMenuOpen = !isMenuOpen)}
		>
			<svg class="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
				<title>Menu</title>
				<path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
			</svg>
		</button>
	</div>

	<!-- Navigation Items -->
	<div
		class={`w-full lg:flex lg:items-center lg:w-auto ${
			isMenuOpen ? 'flex flex-col mt-10 pb-10' : 'hidden'
		} lg:flex`}
	>
		<ul class="flex flex-col lg:flex-row text-sm gap-6">
			{#each navigation.data?.links as item}
				{#if item.dropdown_link === true}
					{@const subItems = getSubItems(item, navigation.data.links)}

					{#if subItems.length > 0}
						<!-- Verwendung der Dropdown-Komponente -->
						<li class="block mt-4 lg:inline-block lg:mt-0">
							<Dropdown
								{item}
								{subItems}
								{headerColor}
								{headerBgColor}
								{headerLinkColor}
								{headerLinkHoverColor}
							/>
						</li>
					{:else if item.link?.url}
						<li
							class="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white"
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
					<li style="color: {headerLinkColor};">
						<PrismicLink field={item.link}>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
</nav>
