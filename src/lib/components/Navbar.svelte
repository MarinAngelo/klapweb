<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { PrismicImage } from '@prismicio/svelte';
	import Dropdown from './Dropdown.svelte';
	import SvgIcon from './SvgIcons.svelte';
	import { theme } from '../stores/theme';
	import { get } from 'svelte/store';
	import { isMenuOpen } from '../stores/isMenuOpen';

	export let navigation;
	export let headerColor;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkHoverColor;
	export let currentPath;
	export let settings;
	export let prismicTheme;

	const { navFont } = get(theme);

	function toggleMenu() {
		isMenuOpen.update((open) => !open);
	}

	// Hilfsfunktion zum Ermitteln der Subitems
	function getSubItems(triggerItem, allLinks) {
		if (!triggerItem || !allLinks) return [];

		const triggerLabel = triggerItem.label?.[0]?.text;
		if (!triggerLabel) return [];

		return allLinks.filter(
			(subItem) =>
				subItem.sub_link &&
				subItem.sub_link === triggerLabel &&
				subItem !== triggerItem
		);
	}

</script>

<nav class="flex items-center justify-between flex-wrap p-6" style="font-family: {navFont};">
	<!-- Logo -->
	<div class="flex items-center flex-shrink-0 mr-6">
		{#if prismicTheme.data.logo?.url}
			<a href="/" class="flex items-center">
				<PrismicImage field={settings.data.logo} alt={settings.data.alt} class="h-12 w-auto" />
			</a>
		{:else}
			<a href="/" style="color: {headerColor};">
				<span class="text-xl font-semibold tracking-tight">
					<PrismicText field={settings.data.site_title} /><br />
				</span>
				<span>
					<PrismicText
						field={settings.data.site_sub_title}
						style="font-size: 5rem"
						class="text-sm"
					/>
				</span>
			</a>
		{/if}
	</div>

	<!-- Hamburger Button -->
	<div class="block lg:hidden">
		{#if $isMenuOpen}
			<!-- Close -->
			<button class="btn btn-square btn-ghost h-10 w-10" on:click={toggleMenu}>
				<SvgIcon name="close" />
			</button>
		{:else}
			<!-- Open -->
			<button class="btn btn-square btn-ghost h-10 w-10" on:click={toggleMenu}>
				<SvgIcon name="menu" />
			</button>
		{/if}
	</div>

	<!-- Menüinhalte -->
	<div
		class={`w-full lg:flex lg:items-center lg:w-auto ${
			$isMenuOpen ? 'flex flex-col mt-10 pb-10 h-screen' : 'hidden'
		} lg:flex`}
	>
		<ul class="flex flex-col lg:flex-row text-sm gap-6">
			{#each navigation.data?.links as item}
				{#if item.dropdown_link === true}
					{@const subItems = getSubItems(item, navigation.data.links)}

					{#if subItems.length > 0}
						<li class="text-xl block mt-4 lg:inline-block lg:mt-0">
							<Dropdown
								{item}
								{subItems}
								{headerBgColor}
								{headerLinkColor}
								{headerLinkHoverColor}
								{currentPath}
								on:click={() => isMenuOpen.set(false)}
							/>
						</li>
					{:else if item.link?.url}
						<li class="text-xl font-semibold block mt-4 lg:inline-block lg:mt-0" style="color: {headerLinkColor};">
							<PrismicLink field={item.link} on:click={() => isMenuOpen.set(false)}>
								<PrismicText field={item.label} />
							</PrismicLink>
						</li>
					{/if}
				{:else if item.sub_link}
					<!-- überspringen -->
				{:else if item.link?.url && item.main_nav}
					<li
						class="text-xl font-semibold {currentPath === item.link.url ? 'underline' : ''}"
						style="color: {headerLinkColor};"
					>
						<PrismicLink field={item.link} on:click={() => isMenuOpen.set(false)}>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
</nav>
