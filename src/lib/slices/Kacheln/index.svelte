<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import { theme } from '$lib/stores/theme';
	import { currencySelection } from '$lib/stores/currency';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import ImageCard from './ImageCard.svelte';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { formatPrice, calcDisplayPrice } from '$lib/pricing';
	import InfoTooltip from '$lib/components/InfoTooltip.svelte';

	export let slice: Content.ImageCardsSlice;
	export let slices: any = {};
	export let context: any = {};
	export let index: number = 0;

	const p = slice.primary ?? ({} as any);

	const componentBodyBgColor = p.component_body_bg_color || get(theme).pageBgColor;
	const componentBodyColor = p.component_body_color || get(theme).pageColor;
	// Prüfe ob Hintergrundfarbe vom CMS kommt (nicht Fallback)
	const hasCustomBgColor = !!p.component_body_bg_color;
	// Grid-Spalten aus CMS (2 oder 3, Fallback: 2)
	const gridColumns = String(p.grid_columns).includes('3') ? 3 : 2;

	$: anim = mapAnimation(
		p.animate,
		p.anim_direction,
		p.anim_delay,
		p.anim_duration
	);

	// Stagger-Intervall zwischen den Kacheln (ms)
	const STAGGER_MS = 150;

	// --- Pläne variation ---

	const billingTypeSuffix: Record<string, string> = {
		Einmalig: 'Einmalig',
		Jährlich: 'pro Jahr',
		Monatlich: 'pro Monat'
	};

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

	// plaeneData: keyed by slice.id → array of feature rows per plan
	// shape: Array<Array<{ label: string; wert: string | null; beschreibung?: string }>>
	$: plaeneData = (context?.plaeneData?.[slice.id] ?? []) as Array<
		Array<{ label: string; wert: string | null; beschreibung?: string }>
	>;

	$: planItems = (() => {
		if (slice.variation !== 'plaene') return [];
		return (slice.items as Array<{ plan: any }>).map((item, i) => {
			const planDoc = item.plan;
			const d = planDoc?.data ?? {};
			const titleField = d.title;
			const name: string =
				Array.isArray(titleField) && titleField[0]?.text
					? titleField[0].text
					: (planDoc?.uid ?? '');
			const base: number | null = d.ecommerce_price_chf ?? null;
			const discount: number | null = d.ecommerce_discount_percent ?? null;
			const deposit: number | null = d.ecommerce_deposit_percent ?? globalDepositPct;
			const displayAmount = calcDisplayPrice(base, discount, deposit);
			const converted =
				displayAmount !== null ? Math.round(displayAmount * conversionRate * 100) / 100 : null;
			const billingType: string | null = d.ecommerce_billing_type ?? null;
			const suffix = billingType ? (billingTypeSuffix[billingType] ?? null) : null;
			const hervorhebung = p.hervorhebung ?? 'Keiner';
			const highlight = hervorhebung === `Plan ${i + 1}`;
			const uid = planDoc?.uid as string | undefined;
			const href = uid ? `/beauftragung?dienstleistung=${encodeURIComponent(uid)}` : null;
			const pageHref = uid ? `/${uid}` : null;
			const features: Array<{ label: string; wert: string | null; beschreibung?: string }> = plaeneData[i] ?? [];
			return { name, price: converted, suffix, billingType, highlight, href, pageHref, features };
		});
	})();

	$: cardColor = p.body_color || get(theme).pageColor;
	$: cardBgColor = p.body_bg_color || get(theme).pageBgColor;
	$: btnColor = p.button_color || get(theme).pageColor;
	$: btnBgColor = p.button_bg_color || 'transparent';
	$: borderColor = p.border_color || get(theme).pageColor;
	$: roundCorners = p.round_corners !== false;
	$: ctaLabel = p.cta_label || 'Jetzt bestellen';
</script>

{#if slice.variation === 'plaene'}
	<Bounded
		as="section"
		style="color: {componentBodyColor}; background-color: {componentBodyBgColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		{#if isFilled.richText(p.heading)}
			<h2 class="font-bold mb-8 custom-color">
				<PrismicText field={p.heading} />
			</h2>
		{/if}

		<div
			class="grid grid-cols-1 gap-6"
			style="--plan-cols: {planItems.length};"
		>
			{#each planItems as plan, i}
				<div
					class="relative flex flex-col p-6 border"
					class:border-2={plan.highlight}
					style="
						color: {cardColor};
						background-color: {plan.highlight ? `${cardBgColor}` : cardBgColor};
						border-color: {plan.highlight ? borderColor : `${borderColor}44`};
						border-radius: {roundCorners ? '0.5rem' : '0'};
						{plan.highlight ? `box-shadow: 0 4px 24px ${borderColor}22;` : ''}
					"
				>
					<!-- Plan name + price -->
					<div class="mb-4">
						<h4 class="font-bold">
							{#if plan.pageHref}
								<a
									href={plan.pageHref}
									class="hover:opacity-70 transition-opacity"
									style="color: {cardColor};"
								>{plan.name} <span style="font-size: 0.75em; opacity: 0.6;">↗</span></a>
							{:else}
								{plan.name}
							{/if}
						</h4>
						{#if plan.price !== null}
							<div class="text-2xl font-bold mt-1 tabular-nums">
								{formatPrice(plan.price, activeCurrency)}
							</div>
							{#if plan.suffix}
								<div class="text-sm opacity-60">{plan.suffix}</div>
							{/if}
						{/if}
					</div>

					<!-- Feature list -->
					{#if plan.features.length > 0}
						<ul class="flex-1 mb-6 space-y-2 text-sm font-normal">
							{#if i > 0}
								<li class="text-sm opacity-60 italic pb-1">
									Alles von {planItems[i - 1].name} und:
								</li>
							{/if}
							{#each plan.features as feat}
								<li class="flex items-start gap-2">
									{#if feat.wert === '✓' || (!feat.wert && feat.label)}
										<span style="color: {cardColor};">✓</span>
									{:else if feat.wert === '–' || feat.wert === null}
										<span style="opacity: 0.3;">–</span>
									{:else}
										<span style="color: {cardColor};">{feat.wert}</span>
									{/if}
									<span>
										{feat.label}{#if feat.beschreibung}&thinsp;<InfoTooltip html={feat.beschreibung} />{/if}
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					<!-- CTA -->
					{#if plan.href}
						<a
							href={plan.href}
							class="mt-auto block text-center px-4 py-2 text-sm border transition-opacity hover:opacity-70"
							style="
								color: {btnColor};
								background-color: {btnBgColor};
								border-color: {btnColor};
								border-radius: {roundCorners ? '0.25rem' : '0'};
							"
						>
							{ctaLabel}
						</a>
					{/if}
				</div>
			{/each}
		</div>
	</Bounded>
{:else}
	<Bounded
		tag="section"
		specialLayout={true}
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		class={hasCustomBgColor ? 'pb-16 md:pb-20' : ''}
		style="background-color: {componentBodyBgColor}; --custom-component-color: {componentBodyColor};"
	>
		<div class="grid gap-12">
			{#if isFilled.richText(p.heading)}
				<h2 class="text-center custom-color">
					<PrismicText field={p.heading} />
				</h2>
			{/if}
			<ul
				class="grid grid-cols-1 gap-8 {gridColumns === 3
					? 'md:grid-cols-3'
					: 'md:grid-cols-2'}"
			>
				{#each (p.cards ?? []) as card, i}
					<ImageCard
						{card}
						roundCorners={p.round_corners}
						bodyBgColor={p.body_bg_color}
						bodyColor={p.body_color}
						buttonColor={p.button_color}
						buttonBgColor={p.button_bg_color}
						buttonHoverColor={p.button_hover_color}
						buttonHoverBgColor={p.button_hover_bg_color}
						borderColor={p.border_color}
						revealOptions={anim.animate
							? { ...anim.options, delay: anim.options.delay + i * STAGGER_MS }
							: { direction: 'none' }}
					/>
				{/each}
			</ul>
		</div>
	</Bounded>
{/if}

<style>
	.custom-color {
		color: var(--custom-component-color) !important;
	}

	@media (min-width: 768px) {
		div[style*='--plan-cols'] {
			grid-template-columns: repeat(var(--plan-cols), minmax(0, 1fr));
		}
	}

</style>
