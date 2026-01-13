<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import Dropdown from './Dropdown.svelte';
	import SvgIcon from './SvgIcons.svelte';
	import { theme } from '../stores/theme';
	import { get } from 'svelte/store';
	import { isMenuOpen } from '../stores/isMenuOpen';
	import { onMount, onDestroy } from 'svelte';

	export let navigation;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkFontSize;
	export let headerLinkHoverColor;
	export let currentPath;
	export let headerHeight;

	const { headerLinkFont } = get(theme);

	function toggleMenu() {
		isMenuOpen.update((open) => !open);
	}

	function handleScroll() {
		if ($isMenuOpen) {
			isMenuOpen.set(false);
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);
	});

	onDestroy(() => {
		window.removeEventListener('scroll', handleScroll);
	});

	// Hilfsfunktion zum Ermitteln der Subitems
	function getSubItems(triggerItem, allLinks) {
		if (!triggerItem || !allLinks) return [];

		const triggerLabel = triggerItem.label?.[0]?.text;
		if (!triggerLabel) return [];

		return allLinks.filter(
			(subItem) => subItem.sub_link && subItem.sub_link === triggerLabel && subItem !== triggerItem
		);
	}
</script>

<nav
	class="flex items-center justify-between flex-wrap p-6"
	style="font-family: {headerLinkFont};"
	on:navlinkclick={() => {
		window.dispatchEvent(new CustomEvent('close-dropdown'));
	}}
>
	<!-- Hamburger Button -->
	<div class="block lg:hidden h-full flex items-center">
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

	<!-- Menüinhalte: Vollbild auf Mobile -->
	<div
		class={`${
			$isMenuOpen ? 'fixed left-0 right-0 z-50 flex flex-col items-start text-left p-8' : 'hidden'
		} lg:static lg:block lg:w-auto lg:max-w-none lg:shadow-none lg:p-0`}
		style={$isMenuOpen
			? `top: ${$headerHeight}px; bottom: 0; background-color: ${headerBgColor};`
			: ''}
	>
		<ul
			class="flex flex-col items-start text-left gap-6 w-full
                   lg:flex-row lg:items-center lg:text-center lg:gap-6 lg:w-auto"
		>
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
								{headerLinkFontSize}
								{headerLinkHoverColor}
								{currentPath}
								on:click={() => {
									isMenuOpen.set(false);
									window.dispatchEvent(new CustomEvent('close-dropdown'));
								}}
							/>
						</li>
					{:else if item.link?.url}
						<li
							class="font-semibold block mt-4 lg:inline-block lg:mt-0"
							style="color: {headerLinkColor}; font-size: {headerLinkFontSize}rem;"
						>
							<PrismicLink
								field={item.link}
								on:click={() => {
									isMenuOpen.set(false);
									window.dispatchEvent(new CustomEvent('close-dropdown'));
								}}
							>
								<PrismicText field={item.label} />
							</PrismicLink>
						</li>
					{/if}
				{:else if item.sub_link}
					<!-- überspringen -->
				{:else if item.link?.url && item.main_nav}
					<li
						class="text-xl font-semibold {currentPath === item.link.url
							? 'underline'
							: ''} hover:no-underline
"
						style="
							color: {headerLinkColor};
							--hover-bg-color: transparent;
							--hover-text-color: {headerLinkHoverColor};
						"
					>
						<PrismicLink
							field={item.link}
							on:click={() => {
								isMenuOpen.set(false);
								window.dispatchEvent(new CustomEvent('close-dropdown'));
							}}
							class="transition nav-link"
							style="color: inherit; font-size: {headerLinkFontSize}rem; --nav-hover-bg: {headerLinkHoverColor}; --nav-hover-text: {headerBgColor ??
								'#fff'};"
						>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
</nav>
