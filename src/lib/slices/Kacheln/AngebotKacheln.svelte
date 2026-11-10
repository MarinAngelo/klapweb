<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { isFilled } from '@prismicio/client';
	import { PrismicImage } from '@prismicio/svelte';
	import { createClient } from '$lib/prismicio';
	import PrismicRichText from '$lib/components/PrismicRichText.svelte';
	import Button from '$lib/components/Button.svelte';
	import { reveal, type RevealOptions } from '$lib/actions/reveal';
	import { linkHref } from '$lib/stores/linkContext';
	import { formatPrice } from '$lib/pricing';
	import { theme } from '$lib/stores/theme';
	import { _ } from '$lib/stores/i18n';

	export let primary: any;
	export let gridColumns: 2 | 3 = 2;
	export let revealFor: (index: number) => RevealOptions;

	type Offer = {
		uid: string;
		titel: string;
		beschreibung: any;
		dauer: number | null;
		preis: number | null;
		ortName: string;
		bild: any;
		infoPage: any;
		sortOrder: number | null;
	};

	let offers: Offer[] = [];
	let loading = true;
	// Offer uids with free slots; null = unknown (API failed) → «Buchen» stays enabled
	let bookableOffers: Set<string> | null = null;
	let detailOffer: Offer | null = null;

	const hasBorderColor = !!primary?.border_color;
	const roundCorners = primary?.round_corners ?? true;
	const showPrice = primary?.show_price ?? true;
	const buttonColors = {
		color: primary?.button_color || $theme.pageButtonColor,
		bgColor: primary?.button_bg_color || $theme.pageButtonBgColor,
		hoverColor: primary?.button_hover_color || $theme.pageButtonHoverColor,
		hoverBgColor: primary?.button_hover_bg_color || $theme.pageButtonHoverBgColor
	};

	$: infoLabel = primary?.info_button_label || $_('Mehr erfahren');
	$: bookingLabel = primary?.booking_button_label || $_('Buchen');
	$: bookingBase = isFilled.link(primary?.booking_page) ? $linkHref(primary.booking_page) : '';

	// Booking page with the offer preselected (InputField «Termin» reads ?angebot=)
	function bookingHref(offer: Offer): string {
		if (!bookingBase) return '';
		const separator = bookingBase.includes('?') ? '&' : '?';
		return `${bookingBase}${separator}angebot=${encodeURIComponent(offer.uid)}`;
	}

	// «Reihenfolge (Kacheln)» ascending, empty last; then by title
	function byOrder(a: Offer, b: Offer): number {
		const orderA = a.sortOrder ?? Infinity;
		const orderB = b.sortOrder ?? Infinity;
		if (orderA !== orderB) return orderA < orderB ? -1 : 1;
		return a.titel.localeCompare(b.titel, 'de');
	}

	function toOffer(doc: any): Offer {
		const d = doc.data ?? {};
		return {
			uid: doc.uid ?? '',
			titel: d.titel || doc.uid || '',
			beschreibung: d.beschreibung ?? [],
			dauer: typeof d.dauer === 'number' && d.dauer > 0 ? d.dauer : null,
			preis: typeof d.preis === 'number' && d.preis > 0 ? d.preis : null,
			ortName: d.ort?.data?.name || '',
			bild: d.bild,
			infoPage: isFilled.link(d.info_page) ? d.info_page : null,
			sortOrder: typeof d.sort_order === 'number' ? d.sort_order : null
		};
	}

	onMount(async () => {
		try {
			const client = createClient() as any;
			const lang = $page.data.lang;
			const query = { fetchLinks: ['ort.name'], orderings: [{ field: 'my.angebot.titel' }] };
			const slotsRequest = fetch('/api/termine')
				.then((r) => (r.ok ? r.json() : null))
				.catch(() => null);
			let docs = await client.getAllByType('angebot', { ...query, lang }).catch(() => []);
			// No translation of the offers → main language
			if (!docs.length) docs = await client.getAllByType('angebot', query).catch(() => []);
			offers = docs
				.filter((doc: any) => doc.data?.aktiv !== false && doc.uid)
				.map(toOffer)
				.sort(byOrder);
			const slots = await slotsRequest;
			if (Array.isArray(slots)) {
				bookableOffers = new Set(slots.map((slot: { angebotId?: string }) => slot.angebotId ?? ''));
			}
		} finally {
			loading = false;
		}
	});

	const isBookable = (offer: Offer, known: Set<string> | null) => !known || known.has(offer.uid);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') detailOffer = null;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if loading}
	<p class="text-center text-muted">{$_('Angebote werden geladen…')}</p>
{:else if !offers.length}
	<p class="text-center text-muted">{$_('Zurzeit sind keine Angebote buchbar.')}</p>
{:else}
	<ul class="grid grid-cols-1 gap-8 {gridColumns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}">
		{#each offers as offer, i (offer.uid)}
			<li
				use:reveal={revealFor(i)}
				class="flex flex-col gap-8 {hasBorderColor ? 'border-2' : 'shadow-lg'} {roundCorners
					? 'rounded-2xl'
					: ''}"
				style:background-color={primary?.body_bg_color || $theme.pageBgColor}
				style:--custom-card-color={primary?.body_color || $theme.pageColor}
				style:border-color={primary?.border_color || undefined}
			>
				{#if isFilled.image(offer.bild)}
					<PrismicImage
						field={offer.bild}
						sizes="100vw"
						class="w-full {roundCorners ? 'rounded-t-2xl' : ''}"
					/>
				{/if}
				<div
					class="custom-card-color flex grow flex-col gap-3 px-6 pb-6 leading-relaxed {isFilled.image(
						offer.bild
					)
						? ''
						: 'pt-6'}"
				>
					<h3>{offer.titel}</h3>
					<p class="offer-meta text-sm">
						{#if offer.dauer}<span>{offer.dauer} {$_('Minuten')}</span>{/if}
						{#if showPrice && offer.preis}<span>{formatPrice(offer.preis, 'CHF')}</span>{/if}
						{#if offer.ortName}<span>{offer.ortName}</span>{/if}
					</p>
					{#if !offer.infoPage && isFilled.richText(offer.beschreibung)}
						<div class="line-clamp-3">
							<PrismicRichText field={offer.beschreibung} />
						</div>
					{/if}
					{#if bookingBase && !isBookable(offer, bookableOffers)}
						<p class="text-muted text-sm">{$_('Zurzeit keine freien Termine.')}</p>
					{/if}
				</div>
				{#if offer.infoPage || isFilled.richText(offer.beschreibung) || bookingBase}
					<div class="flex flex-wrap gap-x-3 px-6">
						{#if offer.infoPage}
							<Button link={offer.infoPage} text={infoLabel} {...buttonColors} />
						{:else if isFilled.richText(offer.beschreibung)}
							<Button text={infoLabel} {...buttonColors} on:click={() => (detailOffer = offer)} />
						{/if}
						{#if bookingBase}
							{#if isBookable(offer, bookableOffers)}
								<Button href={bookingHref(offer)} text={bookingLabel} {...buttonColors} />
							{:else}
								<Button text={bookingLabel} disabled {...buttonColors} />
							{/if}
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

{#if detailOffer}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div
		class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
		on:click|self={() => (detailOffer = null)}
	>
		<div
			class="modal-card mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg p-8 shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-labelledby="offer-detail-title"
		>
			<h3 id="offer-detail-title" class="mb-2">{detailOffer.titel}</h3>
			<p class="offer-meta mb-4 text-sm">
				{#if detailOffer.dauer}<span>{detailOffer.dauer} {$_('Minuten')}</span>{/if}
				{#if showPrice && detailOffer.preis}<span>{formatPrice(detailOffer.preis, 'CHF')}</span
					>{/if}
				{#if detailOffer.ortName}<span>{detailOffer.ortName}</span>{/if}
			</p>
			{#if isFilled.richText(detailOffer.beschreibung)}
				<div class="mb-6">
					<PrismicRichText field={detailOffer.beschreibung} />
				</div>
			{/if}
			<div class="flex flex-wrap gap-3">
				{#if bookingBase && isBookable(detailOffer, bookableOffers)}
					<Button href={bookingHref(detailOffer)} text={bookingLabel} mb={false} />
				{:else if bookingBase}
					<p class="text-muted w-full text-sm">{$_('Zurzeit keine freien Termine.')}</p>
				{/if}
				<Button text={$_('Schliessen')} mb={false} on:click={() => (detailOffer = null)} />
			</div>
		</div>
	</div>
{/if}

<style>
	.custom-card-color :global(*) {
		color: var(--custom-card-color) !important;
	}
	.offer-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
	}
</style>
