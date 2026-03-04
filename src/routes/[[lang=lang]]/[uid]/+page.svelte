<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import { currencySelection } from '$lib/stores/currency';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';

	export let data: {
		page: any;
		baseCurrency: string;
		additionalCodes: string[];
		rates: Record<string, number>;
	};

	$: hasPrice = data.page?.data?.ecommerce_price_chf != null;
	$: showSelector = hasPrice && data.additionalCodes.length > 0;

	let selectedCurrency = data.baseCurrency;

	function onCurrencyChange() {
		if (selectedCurrency === data.baseCurrency) {
			currencySelection.set(null);
			sessionStorage.removeItem('preferredCurrency');
		} else {
			currencySelection.set({ code: selectedCurrency, rates: data.rates });
			sessionStorage.setItem('preferredCurrency', selectedCurrency);
		}
	}

	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
</script>

{#if showSelector}
	<Bounded yPadding="none" style="background-color: {bgColor};">
		<div
			class="flex justify-end items-center gap-2 py-2 text-sm"
			style="color: {pageColor}; opacity: 0.7;"
		>
			<span>Währung:</span>
			<select
				bind:value={selectedCurrency}
				on:change={onCurrencyChange}
				class="px-2 py-1 border"
				style="background-color: {bgColor}; color: {pageColor}; border-color: {pageColor}44;"
			>
				<option value={data.baseCurrency}>{data.baseCurrency}</option>
				{#each data.additionalCodes as code}
					{#if data.rates[code] != null}
						<option value={code}>{code}</option>
					{/if}
				{/each}
			</select>
		</div>
	</Bounded>
{/if}

<SliceZone slices={data.page.data.slices} {components} />
