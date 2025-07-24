<script lang="ts">
	import { PrismicLink, PrismicText } from '@prismicio/svelte';
	import DropdownButton from './DropdownButton.svelte';
	import { createEventDispatcher } from 'svelte';

	export let item;
	export let subItems;
	export let headerBgColor;
	export let headerLinkColor;
	export let headerLinkHoverColor;
	export let currentPath;
	export let headerfontSize;

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
	<div on:click={toggleDropdown}>
		<DropdownButton {item} {headerLinkColor} {headerfontSize} />
	</div>

	{#if isOpen}
		<ul
			class="absolute left-0 mt-0 w-48 shadow-lg z-40 rounded py-1"
			style="background-color: {headerBgColor};"
		>
			{#each subItems as dropdownItem, index}
				<li
					class="{currentPath === dropdownItem.link.url ? 'underline' : ''} {index === 0 ? 'mt-11' : ''} p-2 font-semibold tracking-tight block"
					style="color: {headerLinkColor}; font-size: {headerfontSize}rem"
					on:click={() => {
						closeDropdown();
						dispatch('click'); // 🟢 wichtig: Event an Parent senden!
					}}
				>
					<PrismicLink field={dropdownItem.link}>
						<PrismicText field={dropdownItem.label} />
					</PrismicLink>
				</li>
			{/each}
		</ul>
	{/if}
</div>
