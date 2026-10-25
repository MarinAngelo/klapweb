<script lang="ts">
	import { page } from '$app/stores';
	import SvgIcon from './SvgIcons.svelte';
	import { _ } from '$lib/stores/i18n';
	import { cartCount } from '$lib/stores/cart';
	import { isMenuOpen } from '$lib/stores/isMenuOpen';

	export let color: string;
	export let fontSize: string | number | undefined = undefined;

	$: href = `${$page.params.lang ? `/${$page.params.lang}` : ''}/warenkorb`;
	$: label = `${$_('Warenkorb')} (${$cartCount})`;
</script>

<!-- Only shown once something is in the cart (state lives in the browser) -->
{#if $cartCount > 0}
	<a
		{href}
		on:click={() => isMenuOpen.set(false)}
		class="nav-link relative inline-flex items-center transition"
		style="color: {color}; {fontSize ? `font-size: ${fontSize}rem;` : ''}"
		aria-label={label}
		title={label}
	>
		<SvgIcon name="cart" {color} size="1.4em" />
		<span class="cart-badge" aria-hidden="true">{$cartCount}</span>
	</a>
{/if}

<style>
	.cart-badge {
		position: absolute;
		top: -0.35em;
		right: -0.55em;
		min-width: 1.25em;
		height: 1.25em;
		padding: 0 0.3em;
		border-radius: 9999px;
		background: var(--page-link-color, currentColor);
		color: var(--page-bg-color, #fff);
		font-size: 0.65em;
		font-weight: 700;
		line-height: 1.25em;
		text-align: center;
	}
</style>
