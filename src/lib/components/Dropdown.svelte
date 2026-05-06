<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let item;
	export let subItems;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkHoverColor;
	export let currentPath;
	export let headerLinkFontSize;

	const dispatch = createEventDispatcher();
	let isOpen = false;
	let dropdownBg = '';

	function resolveHeaderBg(el: HTMLElement): string {
		const header = el.closest('header');
		if (header) {
			const c = getComputedStyle(header).backgroundColor;
			if (c && c !== 'rgba(0, 0, 0, 0)') return c;
		}
		return headerBgColor;
	}

	let containerEl: HTMLElement;

	function toggleDropdown() {
		if (!isOpen && typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('close-dropdown'));
			dropdownBg = resolveHeaderBg(containerEl);
		}
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleGlobalClose() {
		isOpen = false;
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('close-dropdown', handleGlobalClose);
		}
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('close-dropdown', handleGlobalClose);
		}
	});
</script>

<div
	bind:this={containerEl}
	class="relative"
	role="navigation"
	style="--hover-bg-color: {headerLinkHoverColor}; --normal-text-color: {headerLinkColor};"
	on:mouseleave={closeDropdown}
>
	<DropdownButton {item} {headerLinkColor} {headerLinkFontSize} onClick={toggleDropdown} />

	{#if isOpen}
		<ul
			class="dropdown-menu left-0 mt-0 shadow-lg z-40 rounded pt-1 pb-4"
			style="background-color: {dropdownBg || headerBgColor}; min-width: 14rem;"
		>
			{#each subItems as dropdownItem, index}
				<li
					class="{currentPath === dropdownItem.link.url ? 'underline' : ''} {index === 0
						? 'mt-11'
						: ''} px-5 py-0 font-semibold tracking-tight block text-left"
					style="
				font-size: {headerLinkFontSize}rem;
				white-space: normal;
				overflow-wrap: break-word;
				hyphens: auto;
				min-width: 14rem;
				text-align: left;
			"
				>
					<PrismicLink
						field={dropdownItem.link}
						on:click={() => {
							closeDropdown();
							dispatch('click');
						}}
						class="block w-full transition-colors dropdown-link"
						style="
					color: {headerLinkColor};
					
				"
					>
						<PrismicText field={dropdownItem.label} />
					</PrismicLink>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dropdown-menu {
		/* Mobile: Static positioning to push content down */
		position: static;
		width: 100%;
		max-width: 100%;
	}

	/* Desktop: Absolute positioning to overlay */
	@media (min-width: 768px) {
		.dropdown-menu {
			position: absolute;
			width: max-content;
			max-width: none;
		}
	}

	:global(.dropdown-link:hover) {
		text-decoration: underline !important;
	}
	/* optional: falls du auch Textfarbe beim Hover über Variable steuern willst */
	:global(.dropdown-link:hover) * {
		color: inherit;
	}
</style>
