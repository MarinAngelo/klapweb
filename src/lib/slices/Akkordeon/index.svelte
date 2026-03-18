<script lang="ts">
	import type { Content } from '@prismicio/client';
	import Bounded from '$lib/components/Bounded.svelte';
	import { theme } from '$lib/stores/theme';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import ImageTextGrid from '$lib/components/ImageTextGrid.svelte';
	import { mapAnimationFromPrimary } from '$lib/utils/animationMapper';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';
	import { reveal } from '$lib/actions/reveal';
	import { hexLuminance, shadeColor } from '$lib/utils/color';

	export let slice: Content.AccordionSlice;
	export let context: any = {};
	const p = slice.primary ?? ({} as any);

	const { openIndex, toggleItem } = useOpenIndex(p?.erstes_item_ausgeklappt === false ? null : 0);

	// Animation aus CMS-Feldern mappen
	$: anim = mapAnimationFromPrimary(slice.primary);

	const STAGGER_MS = 150;

	$: leistungenItems = (context?.pageLeistungen ?? []) as Array<{ leistung: any }>;
	$: isLeistungen = (slice.variation as string) === 'leistungen';

	let searchQuery = '';

	function richTextToPlain(field: { text?: string }[]): string {
		if (!Array.isArray(field)) return '';
		return field.map((b) => b.text ?? '').join(' ');
	}

	$: filteredItems = p.mit_suche && searchQuery.trim()
		? (p.accordion_items ?? []).filter((item: { label?: string; content?: { text?: string }[] }) => {
				const q = searchQuery.toLowerCase();
				return (
					(item.label ?? '').toLowerCase().includes(q) ||
					richTextToPlain(item.content).toLowerCase().includes(q)
				);
			})
		: (p.accordion_items ?? []);

	/**
	 * Farb-Override-System: CMS-Felder überschreiben Page-Theme-Farben wenn gesetzt.
	 * Alle Felder sind optional (leer = Fallback auf globale Seitenfarbe).
	 *
	 * bg_color      → Hintergrund des inneren Content-Divs (nicht Bounded-Section).
	 *                 Auto-Padding + border-radius wenn gesetzt, damit Schrift nicht am Rand klebt.
	 *                 Angewendet auf: flex-col-Gap-Div (background-color)
	 *
	 * text_color    → Schriftfarbe für den gesamten Slice (Titel, Beschreibung, Labels, Body).
	 *                 Gesetzt via color: + --page-color: (nötig weil app.css h1–h4, p, li auf var(--page-color) zeigen).
	 *                 Angewendet auf: flex-col-Gap-Div
	 *
	 * link_color    → Linkfarbe via --page-link-color CSS-Variable.
	 *                 Angewendet auf: flex-col-Gap-Div
	 *
	 * border_color  → Rahmenfarbe der Akkordeon-Rows + dezenter 11%-Tint als Zeilen-Hintergrund.
	 *                 Fallback: effectiveTextColor (passt automatisch zur Schriftfarbe).
	 *                 Angewendet auf: jeden Row-Wrapper (border-color + background-color)
	 *
	 * contrast_amount → Offset für itemTextColor im geöffneten Panel (siehe unten).
	 */
	$: effectiveBgColor = p.bg_color || $theme.pageBgColor;
	$: effectiveTextColor = p.text_color || $theme.pageColor;
	$: effectiveLinkColor = p.link_color || $theme.pageLinkColor;
	$: effectiveBorderColor = p.border_color || effectiveTextColor;

	/**
	 * Steuert die Textfarbe im aufgeklappten Content-Bereich.
	 *
	 * contrast_amount im CMS (oder contrastAmount-Prop) = 0 (Standard):
	 *   automatische Richtung basierend auf Hintergrundhelligkeit
	 *   - heller Hintergrund (Luminanz > 0.5) → Text wird um 50 Stufen dunkler
	 *   - dunkler Hintergrund                 → Text wird um 50 Stufen heller
	 *
	 * contrast_amount ≠ 0: manueller Override
	 *   - negativer Wert (z.B. -40) → Text dunkler
	 *   - positiver Wert (z.B. +40) → Text heller
	 *
	 * Hinweis: wirkt via CSS-Variable --page-color, da p/li in app.css
	 * explizit color: var(--page-color) setzen (überschreibt normale Vererbung).
	 */
	export let contrastAmount: number = 0;
	$: resolvedContrastAmount = p.contrast_amount ?? contrastAmount;
	$: itemTextColor = shadeColor(
		effectiveTextColor || '#000000',
		resolvedContrastAmount || (hexLuminance(effectiveBgColor || '#ffffff') > 0.5 ? -50 : 50)
	);
</script>

<Bounded
	tag="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	animate={anim.animate}
	animationOptions={anim.options}
	class="{p.mobile_vollbreite ? 'overflow-x-clip' : ''}"
>
	<div class="flex flex-col gap-4 {p.mobile_vollbreite ? '-mx-6 md:mx-0' : ''} {p.bg_color ? (p.mobile_vollbreite ? 'md:rounded-lg' : 'rounded-lg') : ''} {p.sektion_rahmen ? 'sektion-rahmen' : ''}" style="background-color: {effectiveBgColor}; color: {effectiveTextColor}; --page-color: {effectiveTextColor}; --page-link-color: {effectiveLinkColor};{p.bg_color || p.sektion_rahmen ? 'padding: 1.5rem;' : ''}{p.sektion_rahmen ? `border-color: ${effectiveBorderColor};` : ''}">
		{#if p.heading || p.description || p.mit_suche}
			<div class="{p.bg_color ? '' : (p.mobile_vollbreite ? 'px-6 md:px-0' : '')} flex flex-col gap-4">
				{#if p.heading}
					<PrismicRichText field={p.heading} />
				{/if}
				{#if p.description}
					<PrismicRichText field={p.description} />
				{/if}
				{#if p.mit_suche}
					<input
						type="search"
						bind:value={searchQuery}
						placeholder={p.suchfeld_platzhalter || 'Suchen...'}
						class="search-input w-full px-4 py-2 rounded border"
						style="border-color: {effectiveBorderColor}; background-color: {effectiveBgColor}; color: {effectiveTextColor};"
					/>
				{/if}
			</div>
		{/if}

		{#if isLeistungen}
		{#each leistungenItems as item, index}
			{@const leistung = item.leistung?.data ?? {}}
			<div
				use:reveal={anim.animate
					? { ...anim.options, delay: (anim.options.delay ?? 500) + index * STAGGER_MS }
					: { direction: 'none' }}
				class="border-b pb-4 md:rounded-t min-w-0 {p.bg_color ? 'px-3' : (p.mobile_vollbreite ? 'px-6 md:px-3' : 'px-3')}"
				style="border-color: {effectiveBorderColor}; background-color: {effectiveBorderColor}11;"
			>
				<button
					class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3 py-1"
					aria-haspopup="true"
					aria-expanded={$openIndex === index}
					on:click={() => toggleItem(index)}
				>
					{leistung.label ?? ''}
					<svg
						class="w-6 h-6 ml-1 fill-current transform transition-transform shrink-0"
					style="color: var(--page-link-color);"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						class:rotate-180={$openIndex === index}
					>
						<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
					</svg>
				</button>

				<div class="accordion-body" style="grid-template-rows: {$openIndex === index ? '1fr' : '0fr'};">
					<div class="overflow-hidden">
						<div class="mt-2 px-3 py-2 rounded" style="background-color: {effectiveTextColor}11; --page-color: {itemTextColor};">
							{#if leistung.beschreibung?.length}
								<PrismicRichText field={leistung.beschreibung} />
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	{:else}
		{#each filteredItems as item, index}
			<div
				use:reveal={anim.animate
					? { ...anim.options, delay: (anim.options.delay ?? 500) + index * STAGGER_MS }
					: { direction: 'none' }}
				class="border-b pb-4 md:rounded-t min-w-0 {p.bg_color ? 'px-3' : (p.mobile_vollbreite ? 'px-6 md:px-3' : 'px-3')}"
				style="border-color: {effectiveBorderColor}; background-color: {effectiveBorderColor}11;"
			>
				<button
					class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3 py-1 {!p.bg_color && p.mobile_vollbreite && slice.variation === 'bildUndText' ? 'px-6 md:px-0' : ''}"
					aria-haspopup="true"
					aria-expanded={$openIndex === index}
					on:click={() => toggleItem(index)}
				>
					{item.label}
					<svg
						class="w-6 h-6 ml-1 fill-current transform transition-transform shrink-0"
					style="color: var(--page-link-color);"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						class:rotate-180={$openIndex === index}
					>
						<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
					</svg>
				</button>

				<div class="accordion-body" style="grid-template-rows: {$openIndex === index ? '1fr' : '0fr'};">
					<div class="overflow-x-visible overflow-y-clip">
						<div class="mt-2 py-2 rounded {slice.variation === 'bildUndText' ? (p.mobile_vollbreite ? 'bildtext-fullwidth' : 'px-3') : 'px-3'}" style="background-color: {effectiveTextColor}11; --page-color: {itemTextColor};">
							{#if slice.variation === 'bildUndText'}
								<ImageTextGrid
									image={'image' in item ? item.image : null}
									text={item.content}
									imageLeft={'standardBildLinks' in item ? item.standardBildLinks : false}
									imageBgColor={'bild_hintergrund' in item ? (item.bild_hintergrund ?? '') : ''}
									overlayColor={'bild_hintergrund' in item ? (item.bild_hintergrund ?? '') : ''}
									overlayTransparency={'bild_overlay_transparenz' in item ? (item.bild_overlay_transparenz ?? 100) : 100}
									mobilePadding={p.mobile_vollbreite ? '1.5rem' : ''}
									{theme}
								/>
							{:else}
								<PrismicRichText field={item.content} />
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	{/if}
	</div>
</Bounded>

<style>
	button {
		text-align: left;
		min-width: 0;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.accordion-body {
		display: grid;
		transition: grid-template-rows 300ms ease-out;
	}

	@media (min-width: 768px) {
		.sektion-rahmen {
			border-width: 1px;
			border-style: solid;
			border-radius: 0.5rem;
		}
	}

	@media (max-width: 767px) {
		.bildtext-fullwidth {
			margin-left: -1.5rem;
			margin-right: -1.5rem;
		}
	}

	.search-input::placeholder {
		opacity: 0.5;
	}

	.search-input:focus {
		outline: none;
		box-shadow: 0 0 0 2px currentColor;
	}

	/* Zwingt Listen-Stile zurück */
	:global([data-slice-type='accordion'] ol) {
		list-style-type: decimal !important;
		padding-left: 1.5rem !important;
		margin-bottom: 1rem;
	}

	:global([data-slice-type='accordion'] li) {
		padding-left: 0.5rem;
	}
</style>
