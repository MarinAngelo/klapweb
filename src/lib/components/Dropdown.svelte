<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte';
	import { createEventDispatcher } from 'svelte';

	export let item;
	export let subItems;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkHoverColor;
	export let headerLinkHoverBgColor;
	export let currentPath;
	export let headerLinkFontSize;

	const dispatch = createEventDispatcher();
	let isOpen = false;

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}
</script>

<div
	class="relative"
	style="--hover-bg-color: {headerLinkHoverColor}; --normal-text-color: {headerLinkColor};"
>
	<DropdownButton {item} {headerLinkColor} {headerLinkFontSize} onClick={toggleDropdown} />

	{#if isOpen}
		<ul
			class="dropdown-menu left-0 mt-0 shadow-lg z-40 rounded py-1"
			style="background-color: {headerBgColor}; min-width: 14rem; width: max-content;"
		>
			{#each subItems as dropdownItem, index}
				<li
					class="{currentPath === dropdownItem.link.url ? 'underline' : ''} {index === 0
						? 'mt-11'
						: ''} px-5 py-0 font-semibold tracking-tight block text-left"
					style="
				font-size: {headerLinkFontSize}rem;
				white-space: normal;
				overflow-wrap: anywhere;
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
					--hover-bg-color: {headerLinkHoverBgColor};
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
	}
	
	/* Desktop: Absolute positioning to overlay */
	@media (min-width: 768px) {
		.dropdown-menu {
			position: absolute;
		}
	}

	:global(.dropdown-link:hover) {
		background-color: var(--hover-bg-color) !important;
		text-decoration: underline !important;
	}
	/* optional: falls du auch Textfarbe beim Hover über Variable steuern willst */
	:global(.dropdown-link:hover) * {
		color: inherit;
	}
</style>
