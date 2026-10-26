<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { components } from '$lib/slices';
	import { currencySelection } from '$lib/stores/currency';
	import Bounded from '$lib/components/Bounded.svelte';
	import InputField from '$lib/components/InputField.svelte';

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

	$: currencyOptions = [
		data.baseCurrency,
		...data.additionalCodes.filter((c) => data.rates[c] != null)
	];
</script>

{#if showSelector}
	<Bounded yPadding="none" class="bg-page-bg">
		<div class="text-muted flex justify-end items-center gap-2 py-2 text-sm">
			<span>Währung:</span>
			<InputField
				field={{
					field_name: '',
					field_type: 'Auswahlliste',
					required: false,
					options: currencyOptions.join(',')
				}}
				bind:value={selectedCurrency}
				showLabel={false}
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
