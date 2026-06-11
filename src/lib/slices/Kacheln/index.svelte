<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import { PrismicText } from '@prismicio/svelte';
	import { get } from 'svelte/store';
	import { currencySelection } from '$lib/stores/currency';
	import Bounded from '$lib/components/Bounded.svelte';
	import ImageCard from './ImageCard.svelte';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { mapAnimation } from '$lib/utils/animationMapper';
	import { formatPrice, calcDisplayPrice } from '$lib/pricing';
	import InfoTooltip from '$lib/components/InfoTooltip.svelte';
	import { _ } from '$lib/stores/i18n';
	import { theme } from '$lib/stores/theme';
	import Button from '$lib/components/Button.svelte';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { headingAnchor } from '$lib/actions/headingAnchor';

	export let slice: Content.ImageCardsSlice;
	export let slices: any = {};
	export let context: any = {};
	export let index: number = 0;

	const componentBodyBgColor = slice.primary?.component_body_bg_color || 'var(--page-bg-color)';
	const componentBodyColor = slice.primary?.component_body_color || 'var(--page-color)';
	// Prüfe ob Hintergrundfarbe vom CMS kommt (nicht Fallback)
	const hasCustomBgColor = !!slice.primary?.component_body_bg_color;
	// Grid-Spalten aus CMS (2 oder 3, Fallback: 2)
	const gridColumns = String((slice.primary as any)?.grid_columns ?? '').includes('3') ? 3 : 2;

	$: anim = mapAnimation(
		slice.primary?.animate,
		slice.primary?.anim_direction,
		slice.primary?.anim_delay,
		slice.primary?.anim_duration
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
			const displayAmount = calcDisplayPrice(base, discount, null);
			const converted =
				displayAmount !== null ? Math.round(displayAmount * conversionRate * 100) / 100 : null;
			const billingType: string | null = d.ecommerce_billing_type ?? null;
			const suffix = billingType ? (billingTypeSuffix[billingType] ?? null) : null;
			const hervorhebung = (slice.primary as any).hervorhebung ?? 'Keiner';
			const highlight = hervorhebung === `Plan ${i + 1}`;
			const uid = planDoc?.uid as string | undefined;
			const href = uid ? `/beauftragung?dienstleistung=${encodeURIComponent(uid)}` : null;
			const pageHref = uid ? `/${uid}` : null;
			const features: Array<{ label: string; wert: string | null; beschreibung?: string }> =
				plaeneData[i] ?? [];
			return { name, price: converted, suffix, billingType, highlight, href, pageHref, features };
		});
	})();

	$: cardColor = (slice.primary as any)?.body_color || 'var(--page-color)';
	$: cardBgColor = (slice.primary as any)?.body_bg_color || 'var(--page-bg-color)';
	$: btnStyleName = ((slice.primary as any)?.button_style as any)?.uid || undefined;
	$: btnStileEntry = btnStyleName
		? ($theme.buttonStile ?? []).find((s) => s.name === btnStyleName || s.label === btnStyleName)
		: undefined;
	$: btnStyleSlug = btnStileEntry?.name || btnStyleName;
	$: btnHighlightColor = btnStyleSlug
		? `var(--btn-${btnStyleSlug}-color, var(--page-button-color))`
		: 'var(--page-button-color)';
	$: borderColor = (slice.primary as any)?.border_color || 'var(--page-color)';
	$: roundCorners = (slice.primary as any)?.round_corners !== false;
	$: ctaLabel = (slice.primary as any)?.cta_label || 'Jetzt bestellen';
	$: mobileVollbreite = (slice.primary as any)?.mobile_full_width ?? false;

	// --- Team variation ---
	$: isTeamVariation = (slice as any).variation === 'team';
	$: teamItems = ((slice as any).items ?? []) as Array<Record<string, any>>;
	$: teamCols = String((slice.primary as any)?.grid_columns ?? '').includes('4')
		? 4
		: String((slice.primary as any)?.grid_columns ?? '').includes('3')
			? 3
			: 2;
	$: isCircle = (slice.primary as any)?.image_shape === 'Kreis';
	$: teamRound = (slice.primary as any)?.round_corners !== false;
	$: teamCardColor = (slice.primary as any)?.body_color || 'var(--page-color)';
	$: teamCardBg = (slice.primary as any)?.body_bg_color || 'transparent';
	$: teamHeading = (slice.primary as any)?.heading ?? null;
</script>

{#if slice.variation === 'plaene'}
	<Bounded
		as="section"
		style="color: {componentBodyColor}; background-color: {componentBodyBgColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
		class={mobileVollbreite ? 'overflow-x-clip' : ''}
	>
		<div class={mobileVollbreite ? '-mx-6 md:mx-0' : ''}>
			{#if isFilled.richText(slice.primary?.heading)}
				<h2 class="font-bold mb-8 custom-color">
					<PrismicText field={slice.primary?.heading} />
				</h2>
			{/if}

			<div class="grid grid-cols-1 gap-6" style="--plan-cols: {planItems.length};">
				{#each planItems as plan, i}
					<div
						class="relative flex flex-col p-6 border"
						class:border-2={plan.highlight}
						style="
						color: {cardColor};
						background-color: {plan.highlight ? `${cardBgColor}` : cardBgColor};
					border-color: {plan.highlight ? btnHighlightColor : `${borderColor}44`};
					border-radius: {roundCorners ? '0.5rem' : '0'};
					{plan.highlight
							? `box-shadow: 0 4px 24px color-mix(in srgb, ${btnHighlightColor} 13%, transparent);`
							: ''}
					"
					>
						<!-- Plan name + price -->
						<div class="mb-4">
							<h4 class="font-bold">
								{#if plan.pageHref}
									<a
										href={plan.pageHref}
										class="inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
										style="color: {cardColor};"
										>{plan.name}
										<span class="opacity-60" style="line-height: 0;"
											><SvgIcons name="external-link" size="0.7em" color="currentColor" /></span
										></a
									>
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
						<!-- CTA: Jetzt bestellen -->
						{#if plan.href}
							<div
								class="mb-4 [&_.button-prismic-link]:block [&_.button-prismic-link]:text-center [&_.button-prismic-link]:w-full"
							>
								<Button
									href={plan.href}
									text={ctaLabel}
									styleName={btnStyleName}
									rounded={roundCorners}
									mb={false}
									size="sm"
								/>
							</div>
						{/if}
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
											{feat.label}{#if feat.beschreibung}&thinsp;<InfoTooltip
													html={feat.beschreibung}
												/>{/if}
										</span>
									</li>
								{/each}
							</ul>
						{/if}

						<!-- Details-Button -->
						{#if plan.pageHref}
							<div
								class="mt-auto [&_.button-prismic-link]:block [&_.button-prismic-link]:text-center [&_.button-prismic-link]:w-full"
							>
								<Button
									href={plan.pageHref}
									text={$_('Details')}
									color="var(--page-link-color)"
									bgColor="transparent"
									hoverColor="var(--page-link-hover-color)"
									hoverBgColor="transparent"
									rounded={roundCorners}
									mb={false}
									size="sm"
								/>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</Bounded>
{:else if isTeamVariation}
	<!-- ── Team-Variation ── -->
	<Bounded
		tag="section"
		style="color: {componentBodyColor}; background-color: {componentBodyBgColor};"
		data-slice-type="image_cards"
		data-slice-variation="team"
		animate={anim.animate}
		animationOptions={anim.options}
	>
		{#if isFilled.richText(teamHeading)}
			<h2 use:headingAnchor class="text-center mb-10 custom-color">
				<PrismicText field={teamHeading} />
			</h2>
		{/if}

		<ul
			class="grid grid-cols-2 gap-8
			{teamCols === 4 ? 'md:grid-cols-4' : teamCols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}"
		>
			{#each teamItems as member, i}
				{@const m = member}
				{@const photo = m.photo}
				{@const memberName = m.name}
				{@const memberRole = m.role}
				{@const memberBio = m.bio}
				{@const memberLink = m.link}
				<li
					use:reveal={anim.animate
						? { ...anim.options, delay: (anim.options.delay ?? 0) + i * STAGGER_MS }
						: { direction: 'none' }}
					style="color: {teamCardColor};"
				>
					<!-- Foto -->
					{#if isFilled.image(photo)}
						<div
							class="w-full aspect-square overflow-hidden {isCircle
								? 'rounded-full'
								: teamRound
									? 'rounded-xl'
									: ''}"
							style="background-color: {teamCardBg};"
						>
							<img
								src="{photo.url?.split('?')[0]}?auto=compress,format&w=600&fit=crop&ar=1:1"
								alt={photo.alt ?? memberName ?? ''}
								width="600"
								height="600"
								loading={i < 4 ? 'eager' : 'lazy'}
								decoding="async"
								class="w-full h-full object-cover"
							/>
						</div>
					{:else}
						<div
							class="w-full aspect-square {isCircle
								? 'rounded-full'
								: teamRound
									? 'rounded-xl'
									: ''} flex items-center justify-center opacity-20"
							style="background-color: {teamCardColor};"
						>
							<svg viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12">
								<path
									d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"
								/>
							</svg>
						</div>
					{/if}

					<!-- Name + Rolle -->
					<div>
						{#if memberName}
							<p class="font-semibold leading-snug">{memberName}</p>
						{/if}
						{#if memberRole}
							<p class="text-sm opacity-60 mt-0.5">{memberRole}</p>
						{/if}
					</div>

					<!-- Bio -->
					{#if isFilled.richText(memberBio)}
						<div class="text-sm opacity-80 leading-relaxed">
							<PrismicRichText field={memberBio} />
						</div>
					{/if}

					<!-- Link -->
					{#if isFilled.link(memberLink)}
						<a
							href={memberLink.url}
							target={'target' in memberLink ? (memberLink.target ?? '_blank') : '_blank'}
							rel="noopener noreferrer"
							class="text-xs underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity"
							style="color: {teamCardColor};"
						>
							{memberLink.url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ?? 'Link'}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</Bounded>
{:else}
	<Bounded
		tag="section"
		class="{hasCustomBgColor ? 'pb-16 md:pb-20' : ''} {mobileVollbreite ? 'overflow-x-clip' : ''}"
		style="background-color: {componentBodyBgColor}; --custom-component-color: {componentBodyColor};"
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		<div class="grid gap-12 {mobileVollbreite ? '-mx-6 md:mx-0' : ''}">
			{#if isFilled.richText(slice.primary?.heading)}
				<h2 use:headingAnchor class="text-center custom-color">
					<PrismicText field={slice.primary?.heading} />
				</h2>
			{/if}
			<ul class="grid grid-cols-1 gap-8 {gridColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}">
				{#each slice.primary?.cards ?? [] as card, i}
					<ImageCard
						{card}
						roundCorners={slice.primary?.round_corners}
						bodyBgColor={slice.primary?.body_bg_color}
						bodyColor={slice.primary?.body_color}
						buttonColor={slice.primary?.button_color}
						buttonBgColor={slice.primary?.button_bg_color}
						buttonHoverColor={slice.primary?.button_hover_color}
						buttonHoverBgColor={slice.primary?.button_hover_bg_color}
						borderColor={slice.primary?.border_color}
						revealOptions={anim.animate
							? { ...anim.options, delay: (anim.options.delay ?? 0) + i * STAGGER_MS }
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
