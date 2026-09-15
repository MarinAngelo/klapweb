<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte';
	import SvgIcons from './SvgIcons.svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { headerHeight } from '$lib/stores/headerHeight';

	export let item;
	export let subItems;
	export let headerBgColor: string = '';
	export let headerLinkColor;
	export let headerLinkHoverColor;
	export let currentPath;
	export let headerLinkFontSize;
	export let options: { value: string; label: string }[] = [];
	export let value = '';
	export let label = '';
	export let selectMode = false;
	export let inputId: string | undefined = undefined;
	let selectOpen = false;

	$: selectedOption = options.find((option) => option.value === value);

	const dispatch = createEventDispatcher();
	let isOpen = false;
	let dropdownBg = '';
	let dropdownTop = 0;

	function resolveHeaderBg(el: HTMLElement): string {
		const header = el.closest('header');
		if (header) {
			const c = getComputedStyle(header).backgroundColor;
			if (c && c !== 'rgba(0, 0, 0, 0)') return c;
		}
		return headerBgColor;
	}

	let containerEl: HTMLElement;

	function openDropdown() {
		if (!isOpen && typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('close-dropdown'));
			dropdownBg = resolveHeaderBg(containerEl);
			// Berechne den Abstand zum unteren Rand des Headers
			const rect = containerEl.getBoundingClientRect();
			dropdownTop = $headerHeight - rect.bottom;
		}
		isOpen = true;
	}

	function toggleDropdown() {
		if (!isOpen) openDropdown();
		else closeDropdown();
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

{#if selectMode}
	<div class="select-dropdown">
		{#if label}<span class="select-dropdown-label">{label}</span>{/if}
		<button
			type="button"
			class="select-dropdown-trigger"
			id={inputId}
			on:click={() => (selectOpen = !selectOpen)}
			aria-haspopup="listbox"
			aria-expanded={selectOpen}
		>
			<span>{selectedOption?.label || options[0]?.label}</span>
			<SvgIcons name={selectOpen ? 'up' : 'down'} size="1em" />
		</button>
		{#if selectOpen}
			<div class="select-dropdown-menu" role="listbox" aria-label={label}>
				{#each options as option}
					<button
						type="button"
						class:active={value === option.value}
						role="option"
						aria-selected={value === option.value}
						on:click={() => {
							value = option.value;
							selectOpen = false;
							dispatch('value', value);
							dispatch('change', value);
						}}
					>
						{option.label}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<div
		bind:this={containerEl}
		class="relative"
		role="navigation"
		style="--header-link-hover-color: {headerLinkHoverColor}; --normal-text-color: {headerLinkColor};"
		on:mouseenter={openDropdown}
		on:mouseleave={closeDropdown}
	>
		<DropdownButton
			{item}
			{headerLinkColor}
			{headerLinkFontSize}
			onClick={toggleDropdown}
			{isOpen}
		/>

		{#if isOpen}
			<ul
				class="dropdown-menu left-0 shadow-lg z-40 rounded pt-4 pb-4"
				style="background-color: {dropdownBg ||
					headerBgColor}; min-width: 14rem; --dropdown-top: {dropdownTop}px;"
			>
				{#each subItems as dropdownItem}
					<li
						class="{currentPath === dropdownItem.link.url
							? 'underline'
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
							style="color: {headerLinkColor}; --header-link-hover-color: {headerLinkHoverColor};"
						>
							<PrismicText field={dropdownItem.label} />
						</PrismicLink>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.dropdown-menu {
		/* Mobile: Static positioning to push content down */
		position: static;
		width: 100%;
		max-width: 100%;
	}

	/* Desktop: Absolute positioning to overlay, aligned to header bottom */
	@media (min-width: 1024px) {
		.dropdown-menu {
			position: absolute;
			width: max-content;
			max-width: none;
			top: calc(100% + var(--dropdown-top, 0px));
		}

		/* Unsichtbarer Bereich der die Lücke zwischen Button und Dropdown überbrückt */
		.dropdown-menu::before {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 100%;
			height: calc(var(--dropdown-top, 0px) + 1rem);
		}
	}

	:global(.dropdown-link:hover) {
		color: var(--header-link-hover-color) !important;
		text-decoration: underline !important;
	}

	.select-dropdown {
		position: relative;
		min-width: 10rem;
	}

	.select-dropdown-label {
		display: block;
		margin-bottom: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.5rem;
	}

	.select-dropdown-trigger {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.25rem;
		padding: 0.5rem 0.7rem;
		border: 0;
		border-bottom: 1px solid var(--page-color);
		background-color: var(--page-bg-color);
		color: var(--page-color);
		font: inherit;
		font-size: 0.875rem;
		line-height: 1.25rem;
		text-align: left;
		cursor: pointer;
	}

	.select-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		box-shadow: 0 0.5rem 1rem color-mix(in srgb, var(--page-color) 18%, transparent);
		border-bottom: 1px solid var(--page-color);
		background-color: var(--page-bg-color);
	}

	.select-dropdown-menu button {
		padding: 0.5rem 0.7rem;
		border: 0;
		background: transparent;
		color: var(--page-color);
		text-align: left;
		cursor: pointer;
	}

	.select-dropdown-menu button:hover,
	.select-dropdown-menu button.active {
		background-color: color-mix(in srgb, var(--page-color) 8%, var(--page-bg-color));
	}
</style>
