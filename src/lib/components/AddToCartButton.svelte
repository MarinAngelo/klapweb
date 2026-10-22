<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	import { addToCart, cart, type CartItem } from '$lib/stores/cart';

	/** Leistung or package page to add (price = display price in the base currency) */
	export let item: CartItem;
	export let size: 'sm' | 'md' | 'lg' = 'sm';
	export let mb = false;

	// Cart lives in localStorage → state is only known after hydration
	$: inCart = $cart.some((i) => i.type === item.type && i.uid === item.uid);
	$: cartHref = `${$page.params.lang ? `/${$page.params.lang}` : ''}/warenkorb`;
</script>

{#if inCart}
	<Button href={cartHref} text={$_('Im Warenkorb')} leadingIcon="cart" {size} {mb} />
{:else}
	<Button
		text={$_('In den Warenkorb')}
		leadingIcon="cart"
		{size}
		{mb}
		on:click={() => addToCart(item)}
	/>
{/if}
