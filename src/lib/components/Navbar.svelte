<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';

	// Props definieren
	export let navigation;
	export let headerColor; // Wird für die Textfarbe verwendet

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
		/* // Alternative, wenn sub_link auf eine ID im triggerItem verweist (z.B. triggerItem.id)
           const triggerId = triggerItem.id; // Beispielhaft, Feldname anpassen
           if (!triggerId) return [];
           return allLinks.filter(subItem => subItem.sub_link && subItem.sub_link === triggerId && subItem !== triggerItem);
        */
	}

	console.log('🚀 ~ navigation data links:', navigation.data?.links);
</script>

<ul class="flex flex-wrap gap-6 md:gap-10">
	{#each navigation.data?.links as item}
		{#if item.dropdown_link === true}
			{@const subItems = getSubItems(item, navigation.data.links)}

			{#if subItems.length > 0}
				<li class="relative group">
					<button
						class="font-semibold tracking-tight header-color inline-flex items-center"
						style="--my-header-color: {headerColor};"
						aria-haspopup="true"
						aria-expanded="false"
					>
						<PrismicText field={item.label} />
						<svg
							class="w-4 h-4 ml-1 fill-current"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							><path
								d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
							/></svg
						>
					</button>

					<ul
						class="absolute left-0 mt-0 hidden w-48 bg-white text-slate-700 shadow-lg group-hover:block z-10 rounded py-1"
					>
						{#each subItems as dropdownItem}
							<li>
								<PrismicLink
									field={dropdownItem.link}
									class="block px-4 py-2 text-sm hover:bg-slate-100"
								>
									<PrismicText field={dropdownItem.label} />
								</PrismicLink>
							</li>
						{/each}
					</ul>
				</li>
			{:else if item.link?.url}
				<li
					class="font-semibold tracking-tight header-color"
					style="--my-header-color: {headerColor};"
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
				class="font-semibold tracking-tight header-color"
				style="--my-header-color: {headerColor};"
			>
				<PrismicLink field={item.link}>
					<PrismicText field={item.label} />
				</PrismicLink>
			</li>
		{/if}
	{/each}
</ul>
