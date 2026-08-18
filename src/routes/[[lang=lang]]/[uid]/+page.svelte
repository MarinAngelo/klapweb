<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import { currencySelection } from '$lib/stores/currency';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import SelectField from '$lib/components/SelectField.svelte';

	export let data: {
		page: any;
		baseCurrency: string;
		additionalCodes: string[];
		rates: Record<string, number>;
		globalDepositPct?: number | null;
		plaeneData?: Record<string, Array<Array<{ label: string; wert: string | null }>>>;
		pageLeistungen?: any[];
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
	$: currencyOptions = [
		data.baseCurrency,
		...data.additionalCodes.filter((c) => data.rates[c] != null)
	];
</script>

{#if showSelector}
	<Bounded yPadding="none" style="background-color: {bgColor};">
		<div
			class="flex justify-end items-center gap-2 py-2 text-sm"
			style="color: {pageColor}; opacity: 0.7;"
		>
			<span>Währung:</span>
			<SelectField
				bind:value={selectedCurrency}
				options={currencyOptions}
				on:change={onCurrencyChange}
			/>
		</div>
	</Bounded>
{/if}

<SliceZone
	slices={data.page.data.slices}
	{components}
	context={{
		baseCurrency: data.baseCurrency,
		globalDepositPct: data.globalDepositPct ?? null,
		plaeneData: data.plaeneData ?? {},
		pageLeistungen: data.pageLeistungen ?? [],
		lang: data.page.lang
	}}
/>
