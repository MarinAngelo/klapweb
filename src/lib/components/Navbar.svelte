<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import Dropdown from './Dropdown.svelte';

	// Props definieren
	export let navigation;
	console.log("🚀 ~ navigation:", navigation.data)
	
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

</script>

<nav class="flex items-center justify-between flex-wrap p-6 nav-font-style">
	<!-- Logo -->
	<div class="flex items-center flex-shrink-0 mr-6">
		<a href="/" style="color: {headerColor};">
			<!-- Seiten Titel -->
			<span class="text-xl font-semibold tracking-tight">
				<PrismicText field={settings.data.site_title} /><br />
			</span>
			<!-- Optionaler Untertitel -->
			<span>
				<PrismicText field={settings.data.site_sub_title} style="font-size: 5rem" class="text-sm" />
			</span>
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
			isMenuOpen ? 'flex flex-col mt-10 pb-10 h-screen' : 'hidden'
		} lg:flex`}
	>
		<ul class="flex flex-col lg:flex-row text-sm gap-6">
			{#each navigation.data?.links as item}
				{#if item.dropdown_link === true}
					{@const subItems = getSubItems(item, navigation.data.links)}

					{#if subItems.length > 0}
						<!-- Dropdown-Komponente -->
						<li class="text-xl block mt-4 lg:inline-block lg:mt-0">
							<Dropdown
								{item}
								{subItems}
								{headerBgColor}
								{headerLinkColor}
								{headerLinkHoverColor}
								{currentPath}
								on:click={() => (isMenuOpen = false)}
							/>
						</li>
					{:else if item.link?.url}
						<li
							class="text-xl font-semibold block mt-4 lg:inline-block lg:mt-0"
							style="color: {headerLinkColor};"
						>
							<PrismicLink field={item.link} on:click={() => (isMenuOpen = false)}>
								<PrismicText field={item.label} />
							</PrismicLink>
						</li>
					{/if}
				{:else if item.sub_link}
					{@const _skip = true}
					<!-- Normaler Link -->
				{:else if item.link?.url && item.main_nav}
					<li
						class="text-xl font-semibold {currentPath === item.link.url ? 'underline' : ''}"
						style="color: {headerLinkColor};"
					>
						<PrismicLink field={item.link} on:click={() => (isMenuOpen = false)}>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
</nav>
