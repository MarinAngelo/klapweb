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
			const pageHref = uid ? (planDoc?.type === 'leistung' ? `/leistung/${uid}` : `/${uid}`) : null;
			const features: Array<{ label: string; wert: string | null; beschreibung?: string }> =
				plaeneData[i] ?? [];

			// Extrahiere erste Leistung aus Plan-Page (falls vorhanden)
			const leistungenRefs: Array<{ leistung?: any }> = d.leistungen ?? [];
			const firstLeistung = leistungenRefs[0]?.leistung;
			const leistungHref = firstLeistung?.uid ? `/leistung/${firstLeistung.uid}` : null;
			const leistungName = firstLeistung?.data?.label || firstLeistung?.uid || null;

			return {
				name,
				price: converted,
				suffix,
				billingType,
				highlight,
				href,
				pageHref,
				features,
				leistungHref,
				leistungName
			};
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
	$: ctaLabel = (slice.primary as any)?.cta_label || $_('Jetzt bestellen');
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

	// CMS colors as CSS variables (app.css › .color-scope / .card-* / .plan-card)
	$: planScopeStyle = `--scope-color: ${componentBodyColor}; --scope-bg: ${componentBodyBgColor}; --card-color: ${cardColor}; --card-bg: ${cardBgColor}; --card-border: ${borderColor}; --card-accent: ${btnHighlightColor};`;
	$: teamScopeStyle = `--scope-color: ${componentBodyColor}; --scope-bg: ${componentBodyBgColor}; --card-color: ${teamCardColor}; --card-bg: ${teamCardBg};`;
</script>

{#if slice.variation === 'plaene'}
	<Bounded
		as="section"
		class="color-scope {mobileVollbreite ? 'overflow-x-clip' : ''}"
		style={planScopeStyle}
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		animate={anim.animate}
		animationOptions={anim.options}
	>
		<div class={mobileVollbreite ? '-mx-6 md:mx-0' : ''}>
			{#if isFilled.richText(slice.primary?.heading)}
				<h2 class="font-bold mb-8 custom-color">
					<PrismicText field={slice.primary?.heading} />
				</h2>
			{/if}

			<div
				class="grid grid-cols-1 gap-6 md:grid-cols-[repeat(var(--plan-cols),minmax(0,1fr))]"
				style:--plan-cols={planItems.length}
			>
				{#each planItems as plan, i}
					<div
						class="plan-card relative flex flex-col p-6 border"
						class:border-2={plan.highlight}
						class:is-highlight={plan.highlight}
						class:rounded-lg={roundCorners}
					>
						<!-- Plan name + price -->
						<div class="mb-4">
							<h4 class="font-bold">
								{#if plan.pageHref}
									<a
										href={plan.pageHref}
										class="inline-flex items-center gap-1 hover:opacity-70 transition-opacity !text-inherit"
										>{plan.name}
										<span class="opacity-60 leading-[0]"
											><SvgIcons name="external-link" size="0.7em" color="currentColor" /></span
										></a
									>
								{:else}
									{plan.name}
								{/if}
							</h4>
							{#if plan.leistungHref && plan.leistungName}
								<div class="mt-2 text-sm">
									<a
										href={plan.leistungHref}
										class="inline-flex items-center gap-1 text-primary hover:opacity-70 transition-opacity"
									>
										{plan.leistungName}
										<span class="leading-[0]">
											<SvgIcons name="external-link" size="0.7em" color="currentColor" />
										</span>
									</a>
								</div>
							{/if}
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
										{$_('Alles von {plan} und:').replace('{plan}', planItems[i - 1].name)}
									</li>
								{/if}
								{#each plan.features as feat}
									<li class="flex items-start gap-2">
										{#if feat.wert === '✓' || (!feat.wert && feat.label)}
											<span>✓</span>
										{:else if feat.wert === '–' || feat.wert === null}
											<span class="opacity-30">–</span>
										{:else}
											<span>{feat.wert}</span>
										{/if}
										<span>
											{#if feat.leistungUid}
												<a
													href="/leistung/{feat.leistungUid}"
													class="hover:opacity-70 transition-opacity inline-flex items-center gap-1 !text-inherit"
												>
													{feat.label}
													<span class="leading-[0]"
														><SvgIcons
															name="external-link"
															size="0.7em"
															color="currentColor"
														/></span
													>
												</a>
											{:else}
												{feat.label}
											{/if}
											{#if feat.beschreibung}&thinsp;<InfoTooltip html={feat.beschreibung} />{/if}
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
		class="color-scope"
		style={teamScopeStyle}
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
					class="card-text"
				>
					<!-- Foto -->
					{#if isFilled.image(photo)}
						<div
							class="card-bg w-full aspect-square overflow-hidden {isCircle
								? 'rounded-full'
								: teamRound
									? 'rounded-xl'
									: ''}"
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
									: ''} flex items-center justify-center opacity-20 card-fill"
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
							<p class="text-sm text-muted mt-0.5">{memberRole}</p>
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
							class="text-xs underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity !text-inherit"
						>
							{memberLink.url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ?? $_('Link')}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</Bounded>
{:else}
	<Bounded
		tag="section"
		class="color-scope {hasCustomBgColor ? 'pb-16 md:pb-20' : ''} {mobileVollbreite
			? 'overflow-x-clip'
			: ''}"
		style="--scope-bg: {componentBodyBgColor}; --custom-component-color: {componentBodyColor};"
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
</style>
