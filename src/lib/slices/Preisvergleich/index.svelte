<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { currencySelection } from '$lib/stores/currency';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { formatPrice, calcDisplayPrice } from '$lib/pricing';

	export let slice: any;
	export let slices: any;
	export let context: any;
	export let index: any;

	const { pageColor, pageBgColor } = get(theme);

	$: anim = mapAnimation(
		slice.primary.animate,
		slice.primary.anim_direction,
		slice.primary.anim_delay,
		slice.primary.anim_duration
	);

	const billingTypeSuffix: Record<string, string> = {
		Jährlich: 'pro Jahr',
		Monatlich: 'pro Monat'
	};

	// Resolve up to 3 plan columns from linked page docs
	$: rawPlans = [
		{ field: slice.primary.plan_1, highlight: slice.primary.hervorhebung === 'Plan 1' },
		{ field: slice.primary.plan_2, highlight: slice.primary.hervorhebung === 'Plan 2' },
		{ field: slice.primary.plan_3, highlight: slice.primary.hervorhebung === 'Plan 3' }
	].filter((p) => p.field?.uid);

	$: activeCurrency = (() => {
		const sel = $currencySelection;
		const base: string = context?.baseCurrency ?? 'CHF';
		return sel?.code ?? base;
	})();

	$: conversionRate = (() => {
		const sel = $currencySelection;
		const base: string = context?.baseCurrency ?? 'CHF';
		if (!sel || sel.code === base) return 1;
		return sel.rates[sel.code] ?? 1;
	})();

	$: globalDepositPct = context?.globalDepositPct ?? null;

	$: plans = rawPlans.map((p) => {
		const d = p.field.data ?? {};
		const base: number | null = d.ecommerce_price_chf ?? null;
		const discount: number | null = d.ecommerce_discount_percent ?? null;
		const deposit: number | null = d.ecommerce_deposit_percent ?? globalDepositPct;
		const displayAmount = calcDisplayPrice(base, discount, deposit);
		const converted =
			displayAmount !== null ? Math.round(displayAmount * conversionRate * 100) / 100 : null;
		const billingType: string | null = d.ecommerce_billing_type ?? null;
		const suffix = billingType ? (billingTypeSuffix[billingType] ?? null) : null;

		// Title from StructuredText
		const titleField = d.title;
		const name: string =
			Array.isArray(titleField) && titleField[0]?.text
				? titleField[0].text
				: (p.field.uid ?? '');

		return {
			name,
			uid: p.field.uid as string,
			price: converted,
			billingType,
			priceSuffix: suffix,
			highlight: p.highlight,
			href: `/beauftragung?dienstleistung=${encodeURIComponent(p.field.uid)}`
		};
	});

	// Feature rows — wert keys match plan index
	const wertKeys = ['plan_1_wert', 'plan_2_wert', 'plan_3_wert'] as const;
	$: planCount = rawPlans.length;

	const ctaLabel = slice.primary.cta_label || 'Jetzt bestellen';
	const titel = slice.primary.titel?.[0]?.text ?? null;

	function wertStyle(wert: string | null | undefined): string {
		if (!wert || wert === '–') return 'opacity: 0.3;';
		if (wert === '✓') return `color: ${pageColor};`;
		return '';
	}
</script>

{#if plans.length > 0}
	<Bounded
		as="section"
		style="color: {pageColor}; background-color: {pageBgColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		{#if titel}
			<h2 class="text-2xl font-bold mb-8">{titel}</h2>
		{/if}

		<div class="overflow-x-auto">
			<table class="w-full border-collapse" style="min-width: {160 + planCount * 160}px;">
				<!-- Plan headers -->
				<thead>
					<tr>
						<th class="text-left py-3 pr-6 font-normal w-40"></th>
						{#each plans as plan}
							<th
								class="py-3 px-4 text-center align-top"
								class:border-2={plan.highlight}
								style={plan.highlight
									? `border-color: ${pageColor}; background-color: ${pageColor}11;`
									: ''}
							>
								<div class="font-bold text-lg">{plan.name}</div>
								{#if plan.price !== null}
									<div class="text-2xl font-bold mt-1 tabular-nums">
										{formatPrice(plan.price, activeCurrency)}
									</div>
									{#if plan.priceSuffix}
										<div class="text-sm opacity-60">{plan.priceSuffix}</div>
									{/if}
								{/if}
								<a
									href={plan.href}
									class="inline-block mt-3 px-4 py-2 text-sm border transition-opacity hover:opacity-70"
									style="border-color: {pageColor}; color: {pageColor};"
								>
									{ctaLabel}
								</a>
							</th>
						{/each}
					</tr>
				</thead>

				<!-- Feature rows -->
				<tbody>
					{#each slice.items as item, i}
						{@const featureLabel = item.leistung?.data?.label ?? item.leistung?.uid ?? ''}
						<tr class="border-t" style="border-color: {pageColor}22;">
							<td class="py-3 pr-6 text-sm">{featureLabel}</td>
							{#each plans as plan, pi}
								{@const wert = item[wertKeys[pi]] ?? null}
								<td
									class="py-3 px-4 text-center text-sm"
									class:border-x-2={plan.highlight}
									style={plan.highlight ? `border-color: ${pageColor};` : ''}
								>
									<span style={wertStyle(wert)}>{wert || '–'}</span>
								</td>
							{/each}
						</tr>
					{/each}

					<!-- Bottom border for highlighted column -->
					{#if plans.some((p) => p.highlight)}
						<tr>
							<td></td>
							{#each plans as plan}
								<td
									class="pb-1"
									class:border-b-2={plan.highlight}
									class:border-x-2={plan.highlight}
									style={plan.highlight ? `border-color: ${pageColor};` : ''}
								></td>
							{/each}
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</Bounded>
{/if}
