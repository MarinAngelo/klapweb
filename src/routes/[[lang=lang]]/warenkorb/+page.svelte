<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	import { cart, removeFromCart } from '$lib/stores/cart';
	import { formatPrice, parseCurrencyCode } from '$lib/pricing';
	import { serializeCart } from '$lib/utils/cartSpec';

	// Cart lives in localStorage → render the list only in the browser
	let mounted = false;
	onMount(() => (mounted = true));

	$: langPrefix = $page.params.lang ? `/${$page.params.lang}` : '';
	$: currency = parseCurrencyCode($page.data.settings?.data?.invoice_currency) || 'CHF';
	$: hasPackage = $cart.some((item) => item.type === 'page');
	$: checkoutHref = `${langPrefix}/beauftragung?warenkorb=${encodeURIComponent(serializeCart($cart))}`;

	// Totals per billing type (display prices; the checkout recalculates them on the server)
	$: totals = Object.entries(
		$cart.reduce<Record<string, number>>((acc, item) => {
			if (item.price === null) return acc;
			const type = item.billingType ?? 'Einmalig';
			acc[type] = (acc[type] ?? 0) + item.price;
			return acc;
		}, {})
	);
</script>

<svelte:head>
	<title>{$_('Warenkorb')}{$page.data?.siteName ? ` - ${$page.data.siteName}` : ''}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<Bounded tag="section">
	<Heading tag="h1">{$_('Warenkorb')}</Heading>

	{#if !mounted}
		<p class="opacity-60">{$_('Laden…')}</p>
	{:else if $cart.length === 0}
		<p class="mb-6">{$_('Ihr Warenkorb ist leer.')}</p>
		<Button href="{langPrefix}/leistungen" text={$_('Leistungen ansehen')} size="sm" />
	{:else}
		<ul class="cart-list mb-6">
			{#each $cart as item (`${item.type}:${item.uid}`)}
				<li class="flex items-baseline justify-between gap-4 py-4 border-b">
					<div class="min-w-0">
						<p class="font-semibold break-words">{item.label}</p>
						<p class="text-sm opacity-60">{$_(item.billingType ?? 'Einmalig')}</p>
					</div>
					<div class="flex items-baseline gap-4 shrink-0">
						<span class="tabular-nums">
							{item.price !== null ? formatPrice(item.price, currency) : $_('auf Anfrage')}
						</span>
						<button
							type="button"
							class="text-sm underline opacity-60 hover:opacity-100"
							on:click={() => removeFromCart(item.type, item.uid)}
						>
							{$_('Entfernen')}
						</button>
					</div>
				</li>
			{/each}
		</ul>

		<div class="mb-2">
			{#each totals as [type, total]}
				<div class="flex justify-between font-semibold">
					<span>{$_('Total')} {$_(type)}</span>
					<span class="tabular-nums">{formatPrice(total, currency)}</span>
				</div>
			{/each}
		</div>
		<p class="text-sm opacity-60 mb-1">{$_('exkl. MwSt.')}</p>
		{#if hasPackage}
			<p class="text-sm opacity-60 mb-1">
				{$_('Zusatzleistungen der Pakete (z. B. Hosting) werden in der Bestellübersicht ergänzt.')}
			</p>
		{/if}

		<div class="flex flex-wrap gap-4 mt-8">
			<Button href={checkoutHref} text={$_('Zur Kasse')} />
			<Button href="{langPrefix}/leistungen" text={$_('Weitere Leistungen')} variant="link" />
		</div>
	{/if}
</Bounded>

<style>
	.cart-list {
		list-style: none;
		padding: 0;
	}
	.cart-list li {
		margin: 0;
		border-color: color-mix(in srgb, currentColor 20%, transparent);
	}
</style>
