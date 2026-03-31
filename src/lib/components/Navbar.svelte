<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import { page } from '$app/stores'; // NEU: Für die Pfad-Überwachung
	import Dropdown from './Dropdown.svelte';
	import SvgIcon from './SvgIcons.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	// import { theme } from '../stores/theme';
	// import { get } from 'svelte/store';
	import { isMenuOpen } from '../stores/isMenuOpen';
	import { onMount, onDestroy } from 'svelte';

	export let navigation;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkFontSize;
	export let headerLinkHoverColor;
	export let currentPath;
	export let headerHeight;
	export let lang: string | undefined;
	export let locales: string[] | undefined;
	export let showSwitcher: boolean | undefined;
	export let allAlternates: any[] = [];
	export let headerLinkFont;

	// const { headerLinkFont } = get(theme);

	// 1. REAKTIVER FIX FÜR DAS SCHLIESSEN
	// Sobald sich der Pfad ändert (z.B. durch Sprachwechsel), schließt das Menü.
	$: if ($page.url.pathname) {
		isMenuOpen.set(false);
	}

	function toggleMenu() {
		isMenuOpen.update((open) => !open);
	}

	let menuEl: HTMLDivElement | null = null;

	// Body-Scroll-Lock wenn Menü offen: verhindert dass Seiten-Scroll window.scroll triggert
	$: if (typeof document !== 'undefined') {
		document.body.style.overflow = $isMenuOpen ? 'hidden' : '';
	}

	// Seiten-Scroll (window.scroll feuert nicht bei internem Menü-Scroll)
	function handleWindowScroll() {
		if ($isMenuOpen) isMenuOpen.set(false);
	}

	// Touch-Bewegung: nur schließen wenn der Touch außerhalb des Menü-Containers ist
	function handleTouchmove(e: TouchEvent) {
		if ($isMenuOpen && !menuEl?.contains(e.target as Node)) {
			isMenuOpen.set(false);
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', handleWindowScroll, { passive: true });
			window.addEventListener('touchmove', handleTouchmove, { passive: true });
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', handleWindowScroll);
			window.removeEventListener('touchmove', handleTouchmove);
		}
		if (typeof document !== 'undefined') {
			document.body.style.overflow = '';
		}
	});

	// Hilfsfunktion zum Ermitteln der Subitems
	type NavItem = {
		label?: { text: string }[];
		sub_link?: string;
		link?: { url?: string };
		dropdown_link?: boolean;
		main_nav?: boolean;
		[key: string]: any;
	};

	function getSubItems(triggerItem: NavItem, allLinks: NavItem[]): NavItem[] {
		if (!triggerItem || !allLinks) return [];
		const triggerLabel = triggerItem.label?.[0]?.text;
		if (!triggerLabel) return [];
		return allLinks.filter(
			(subItem: NavItem) =>
				subItem.sub_link && subItem.sub_link === triggerLabel && subItem !== triggerItem
		);
	}
</script>

<nav
	class="flex items-center justify-between flex-wrap p-6 pr-0 lg:py-0 lg:pr-6"
	style="font-family: {headerLinkFont ? headerLinkFont : 'var(--page-font), sans-serif'};"
>
	<div class="block lg:hidden h-full flex items-center">
		<button class="btn btn-square btn-ghost h-10 w-10" on:click={toggleMenu} aria-label="Menu">
			{#if $isMenuOpen}
				<SvgIcon name="close" color={headerLinkColor} />
			{:else}
				<SvgIcon name="menu" color={headerLinkColor} />
			{/if}
		</button>
	</div>

	<div
		bind:this={menuEl}
		class={`${
			$isMenuOpen ? 'fixed left-0 right-0 z-50 flex flex-col items-start text-left p-8' : 'hidden'
		} lg:static lg:block lg:w-auto lg:max-w-none lg:shadow-none lg:p-0`}
		style={$isMenuOpen
			? `top: ${$headerHeight}px; bottom: 0; background-color: ${headerBgColor}; overflow-y: auto;`
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
								on:click={() => isMenuOpen.set(false)}
							/>
						</li>
					{:else if item.link?.url}
						<li
							class="font-semibold block mt-4 lg:inline-block lg:mt-0"
							style="color: {headerLinkColor}; font-size: {headerLinkFontSize}rem;"
						>
							<PrismicLink field={item.link} on:click={() => isMenuOpen.set(false)}>
								<PrismicText field={item.label} />
							</PrismicLink>
						</li>
					{/if}
				{:else if !item.sub_link && item.link?.url && item.main_nav}
					<li
						class="text-xl font-semibold {currentPath === item.link.url
							? 'underline'
							: ''} hover:no-underline"
						style="color: {headerLinkColor}; --hover-text-color: {headerLinkHoverColor};"
					>
						<PrismicLink
							field={item.link}
							on:click={() => isMenuOpen.set(false)}
							class="transition nav-link"
							style="color: inherit; font-size: {headerLinkFontSize}rem;"
						>
							<PrismicText field={item.label} />
						</PrismicLink>
					</li>
				{/if}
			{/each}

			{#if showSwitcher && lang && locales}
				<li
					class="mt-4 pt-6 border-t border-white/10 w-full lg:w-auto lg:mt-0 lg:pt-0 lg:border-none lg:ml-4"
				>
					<LanguageSwitcher {lang} {locales} {allAlternates} />
				</li>
			{/if}
		</ul>
	</div>
</nav>

<style>
	/* Override global li { mb-4 } — nav li must have no bottom margin for correct flex centering */
	nav :global(li) {
		margin-bottom: 0;
	}
</style>
