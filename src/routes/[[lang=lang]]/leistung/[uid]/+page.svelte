<script lang="ts">
	import { page } from '$app/stores';
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { _ } from '$lib/stores/i18n';
	import { components } from '$lib/slices';
	import AddToCartButton from '$lib/components/AddToCartButton.svelte';
	import { formatPrice, parseCurrencyCode } from '$lib/pricing';

	export let data;

	$: leistung = data.leistung;
	$: slices = leistung?.data?.slices ?? [];
	$: langPrefix = $page.params.lang ? `/${$page.params.lang}` : '';
	$: price = ((leistung?.data as Record<string, unknown>)?.price_chf as number | null) ?? null;
	$: label = ((leistung?.data as Record<string, unknown>)?.label as string) || leistung?.uid || '';
	$: currency = parseCurrencyCode($page.data.settings?.data?.invoice_currency) || 'CHF';
</script>

<svelte:head>
	<title>{data.title} - {$page.data?.siteName || ''}</title>
	<meta name="description" content={data.meta_description} />
</svelte:head>

<article>
	<!-- Slices -->
	{#if slices.length > 0}
		<SliceZone {slices} {components} />
	{:else if isFilled.richText(leistung.data.beschreibung)}
		<Bounded tag="header" class="py-12">
			<!-- Full container width: aligned with the page title, same spacing left and right -->
			<div class="text-lg text-muted-foreground">
				<PrismicRichText field={leistung.data.beschreibung} />
			</div>
		</Bounded>
	{:else}
		<Bounded>
			<div class="py-12 text-center text-muted-foreground">
				{$_('Keine weiteren Inhalte verfügbar')}
			</div>
		</Bounded>
	{/if}

	<!-- Price + cart (only when a price is set in Prismic) -->
	{#if price !== null}
		<Bounded tag="aside" class="text-center">
			<p class="text-2xl font-semibold tabular-nums mb-4">
				{formatPrice(price, currency)}
				<span class="text-base font-normal opacity-60">{$_('exkl. MwSt.')}</span>
			</p>
			<AddToCartButton
				size="md"
				item={{
					type: 'leistung',
					uid: leistung.uid ?? '',
					label,
					price,
					billingType: 'Einmalig'
				}}
			/>
		</Bounded>
	{/if}

	<!-- CTA: All Services -->
	<Bounded tag="footer" class="py-12 text-center">
		<Button href="{langPrefix}/leistungen" text={$_('Alle Leistungen anzeigen')} />
	</Bounded>
</article>
