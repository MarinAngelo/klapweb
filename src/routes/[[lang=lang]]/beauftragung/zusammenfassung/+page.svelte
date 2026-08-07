<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import { t } from '$lib/i18n/translations';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import Button from '$lib/components/Button.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import { formatPrice } from '$lib/pricing';
	import type { ProductData } from './+page.server';

	export let data: {
		product: ProductData | null;
		pageTitle: string;
		checkoutButtonText: string;
		baseCurrency: string;
		additionalCodes: string[];
		rates: Record<string, number>;
		paymentMethods: { stripe: boolean; rechnung: boolean; bar: boolean };
		barDescription: string | null;
		eventTexts: {
			summaryTitle: string | null;
			orderLabel: string | null;
			priceLabel: string | null;
			checkoutButtonText: string | null;
			rechnungLabel: string | null;
			rechnungDescription: string | null;
			barLabel: string | null;
			barDescription: string | null;
		} | null;
		isEventCheckout: boolean;
		eventUid: string;
		priceRange?: number | null;
		additionalCostChf?: number | null;
		additionalCostLabel?: string | null;
		eventManagerEmail?: string | null;
	};

	interface CheckoutData {
		data: Record<string, string>;
		labels: Record<string, string>;
	}

	let checkoutData: CheckoutData | null = null;
	let agbAccepted = false;
	// Wenn nur eine Zahlungsart aktiv ist, automatisch vorauswählen
	const availableMethods = (['stripe', 'rechnung', 'bar'] as const).filter(
		(m) => data.paymentMethods[m]
	);
	let selectedPayment: 'stripe' | 'rechnung' | 'bar' | null =
		availableMethods.length === 1 ? availableMethods[0] : null;
	let isLoading = false;
	let orderError: string | null = null;
	let selectedCurrency: string = data.baseCurrency;
	// User-defined price for range-priced events
	let customEventPrice: number = data.priceRange ?? data.product?.price ?? 0;
	const minEventPrice = data.product?.price ?? 0;
	function clampEventPrice() {
		if (customEventPrice < minEventPrice) customEventPrice = minEventPrice;
	}

	// Discount code
	let discountCodeInput = '';
	let appliedCode = '';
	let codeDiscountPct = 0;
	let codeLoading = false;
	let codeError: string | null = null;

	async function applyDiscountCode() {
		const code = discountCodeInput.trim();
		if (!code) return;
		codeLoading = true;
		codeError = null;
		try {
			const resp = await fetch('/api/validate-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});
			if (resp.ok) {
				const result = await resp.json();
				appliedCode = code;
				codeDiscountPct = result.discount;
				codeError = null;
			} else if (resp.status === 410) {
				appliedCode = '';
				codeDiscountPct = 0;
				codeError = t('Abgelaufener Rabatt-Code.', lang);
			} else {
				appliedCode = '';
				codeDiscountPct = 0;
				codeError = t('Ungültiger Rabatt-Code.', lang);
			}
		} catch {
			codeError = t('Verbindungsfehler bei Code-Prüfung.', lang);
		} finally {
			codeLoading = false;
		}
	}

	function removeCode() {
		appliedCode = '';
		codeDiscountPct = 0;
		discountCodeInput = '';
		codeError = null;
	}

	// Fields excluded from the summary display
	const hiddenKeys = new Set(['form-name', 'bot-field', 'subject']);

	onMount(() => {
		const raw = sessionStorage.getItem('checkoutData');
		if (!raw) {
			goto('/');
			return;
		}
		try {
			checkoutData = JSON.parse(raw);
		} catch {
			goto('/');
		}

		// Pre-select currency if the user chose one on the product page
		const stored = sessionStorage.getItem('preferredCurrency');
		if (stored && (stored === data.baseCurrency || data.additionalCodes.includes(stored))) {
			selectedCurrency = stored;
		}
	});

	$: serviceKey = checkoutData?.data['dienstleistung'] ?? '';
	$: displayLabel = data.product?.label ?? serviceKey;
	$: baseDisplayPrice = data.priceRange ? customEventPrice : (data.product?.displayAmount ?? null);
	// Additional costs converted to selected currency
	$: additionalCostDisplay = (() => {
		if (!data.additionalCostChf) return null;
		if (selectedCurrency === data.baseCurrency) return data.additionalCostChf;
		const rate = data.rates[selectedCurrency];
		return rate ? Math.round(data.additionalCostChf * rate * 100) / 100 : data.additionalCostChf;
	})();

	// Convert base price to selected currency using pre-fetched rates
	$: displayPrice = (() => {
		if (baseDisplayPrice === null) return null;
		if (selectedCurrency === data.baseCurrency) return baseDisplayPrice;
		const rate = data.rates[selectedCurrency];
		if (rate == null) return baseDisplayPrice;
		return Math.round(baseDisplayPrice * rate * 100) / 100;
	})();

	// Price after applying discount code
	$: effectiveDisplayPrice = (() => {
		if (displayPrice === null) return null;
		if (codeDiscountPct <= 0) return displayPrice;
		return Math.round(displayPrice * (1 - codeDiscountPct / 100) * 100) / 100;
	})();

	// Convert addon prices to selected currency
	$: addonDisplayPrices = (data.product?.addons ?? []).map((addon) => {
		if (addon.displayAmount === null) return null;
		if (selectedCurrency === data.baseCurrency) return addon.displayAmount;
		const rate = data.rates[selectedCurrency];
		if (rate == null) return addon.displayAmount;
		return Math.round(addon.displayAmount * rate * 100) / 100;
	});

	// Totals grouped by billing type (main product + addons)
	$: groupedTotals = (() => {
		const totals: Record<string, number> = {};
		const mainType = data.product?.billingType ?? 'Einmalig';
		if (effectiveDisplayPrice !== null) {
			totals[mainType] = (totals[mainType] ?? 0) + effectiveDisplayPrice;
		}
		(data.product?.addons ?? []).forEach((addon, i) => {
			const price = addonDisplayPrices[i];
			if (price === null) return;
			const type = addon.billingType ?? 'Einmalig';
			totals[type] = (totals[type] ?? 0) + price;
		});
		return Object.entries(totals);
	})();

	$: hasAddons = (data.product?.addons ?? []).length > 0;

	$: grandTotal = (() => {
		if (effectiveDisplayPrice === null) return null;
		const addonSum = addonDisplayPrices.reduce((s, p) => s + (p ?? 0), 0);
		return effectiveDisplayPrice + addonSum + (additionalCostDisplay ?? 0);
	})();

	$: stripeUrl =
		data.product?.stripeUrl && checkoutData?.data['email']
			? `${data.product.stripeUrl}?prefilled_email=${encodeURIComponent(checkoutData.data['email'])}`
			: (data.product?.stripeUrl ?? '');

	$: noChrome = $page.url.searchParams.get('no_chrome') === 'true';
	$: noChromeParam = noChrome ? '&no_chrome=true' : '';
	$: eventCheckoutParam = data.isEventCheckout ? '&event_checkout=true' : '';

	$: stripeTarget = import.meta.env.DEV
		? `/beauftragung/bestaetigung?simulated=true&service=${encodeURIComponent(serviceKey)}&label=${encodeURIComponent(displayLabel)}${noChromeParam}${eventCheckoutParam}`
		: stripeUrl;

	$: buttonText = isLoading
		? t('Bitte warten…', lang)
		: data.checkoutButtonText || t('Kostenpflichtig bestellen', lang);

	$: canOrder = agbAccepted && selectedPayment !== null && !isLoading;

	async function handleOrder() {
		if (!canOrder || !checkoutData) return;
		isLoading = true;
		orderError = null;

		const serviceParam = encodeURIComponent(serviceKey);
		const labelParam = encodeURIComponent(displayLabel);

		if (selectedPayment === 'stripe') {
			sessionStorage.removeItem('checkoutData');
			sessionStorage.removeItem('preferredCurrency');
			window.location.href = stripeTarget;
			return;
		}

		if (selectedPayment === 'rechnung') {
			try {
				const resp = await fetch('/api/invoice', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						data: checkoutData.data,
						labels: checkoutData.labels,
						serviceKey,
						selectedCurrency,
						discountCode: appliedCode || undefined,
						...(data.isEventCheckout && {
							isEventCheckout: true,
							eventPrice: grandTotal,
							eventLabel: displayLabel,
							eventManagerEmail: data.eventManagerEmail ?? null
						})
					})
				});
				if (!resp.ok) {
					const err = await resp.json().catch(() => ({}));
					orderError = (err as { error?: string }).error ?? t('Ein Fehler ist aufgetreten.', lang);
					isLoading = false;
					return;
				}
				if (data.isEventCheckout && data.eventUid) {
					fetch('/api/event-ticket', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ eventUid: data.eventUid })
					}).catch(() => {});
				}
				sessionStorage.removeItem('checkoutData');
				sessionStorage.removeItem('preferredCurrency');
				goto(
					`/beauftragung/bestaetigung?method=rechnung&service=${serviceParam}&label=${labelParam}${noChromeParam}${eventCheckoutParam}`
				);
			} catch {
				orderError = t('Verbindungsfehler. Bitte versuchen Sie es erneut.', lang);
				isLoading = false;
			}
			return;
		}

		if (selectedPayment === 'bar') {
			// Rechnung + Kundendaten erstellen
			fetch('/api/create-invoice-bar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: new Date().toISOString(),
					paymentMethod: 'bar',
					service: data.product?.label ?? serviceParam,
					amount: grandTotal,
					currency: selectedCurrency,
					discountCode: appliedCode || undefined,
					vorname: checkoutData.data['vorname'],
					nachname: checkoutData.data['nachname'],
					firma: checkoutData.data['firma'],
					email: checkoutData.data['email'],
					adresse: checkoutData.data['adresse'],
					plz: checkoutData.data['plz'],
					ort: checkoutData.data['ort'],
					land: checkoutData.data['land'],
					...(data.isEventCheckout && {
						isEventCheckout: true,
						eventUid: serviceKey,
						eventLabel: displayLabel,
						eventManagerEmail: data.eventManagerEmail ?? null,
						labels: checkoutData.labels
					})
				})
			}).catch(() => {});

			// Dev-Modus: Netlify-POST überspringen
			if (import.meta.env.DEV) {
				sessionStorage.removeItem('checkoutData');
				sessionStorage.removeItem('preferredCurrency');
				goto(
					`/beauftragung/bestaetigung?method=bar&service=${serviceParam}&label=${labelParam}${noChromeParam}${eventCheckoutParam}`
				);
				return;
			}
			try {
				const params = new URLSearchParams();
				params.set('form-name', 'beauftragung_bar');
				for (const [k, v] of Object.entries(checkoutData.data)) {
					params.set(k, v);
				}
				if (grandTotal !== null) {
					params.set('preis', formatPrice(grandTotal, selectedCurrency));
				}
				const resp = await fetch('/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: params.toString()
				});
				if (!resp.ok) {
					orderError = t('Übermittlung fehlgeschlagen. Bitte versuchen Sie es erneut.', lang);
					isLoading = false;
					return;
				}
				if (data.isEventCheckout && data.eventUid) {
					fetch('/api/event-ticket', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ eventUid: data.eventUid })
					}).catch(() => {});
				}
				sessionStorage.removeItem('checkoutData');
				sessionStorage.removeItem('preferredCurrency');
				goto(
					`/beauftragung/bestaetigung?method=bar&service=${serviceParam}&label=${labelParam}${noChromeParam}${eventCheckoutParam}`
				);
			} catch {
				orderError = t('Verbindungsfehler. Bitte versuchen Sie es erneut.', lang);
				isLoading = false;
			}
		}
	}

	$: lang = $page.data.lang || 'de-ch';
	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
	$: borderColor = get(theme).pageColor;
</script>

<svelte:head>
	<title>{data.pageTitle || t('Bestellübersicht', lang)}</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">
	{#if !checkoutData}
		<p>{t('Laden…', lang)}</p>
	{:else}
		<Heading tag="h1">{data.pageTitle || t('Bestellübersicht', lang)}</Heading>

		<!-- Dienstleistung + Preis -->
		<div class="mb-10 p-6 border" style="border-color: {borderColor};">
			<p class="text-sm uppercase tracking-wide opacity-60 mb-1">
				{data.eventTexts?.orderLabel ?? t('Ihre Bestellung', lang)}
			</p>

			{#if hasAddons}
				<!-- Row layout: main product + addons side by side -->
				<div class="flex items-baseline justify-between gap-4 mt-2">
					<p class="text-lg font-semibold">
						{displayLabel || (checkoutData.data['dienstleistung'] ?? '—')}
					</p>
					{#if effectiveDisplayPrice !== null}
						<p class="text-lg font-semibold tabular-nums shrink-0">
							{#if codeDiscountPct > 0}<span class="line-through opacity-40 text-base mr-1"
									>{formatPrice(displayPrice, selectedCurrency)}</span
								>{/if}{formatPrice(effectiveDisplayPrice, selectedCurrency)}
						</p>
					{/if}
				</div>
				<p class="text-sm opacity-60 mt-0.5">{t(data.product?.billingType ?? 'Einmalig', lang)}</p>

				{#each data.product?.addons ?? [] as addon, i}
					<div
						class="flex items-baseline justify-between gap-4 mt-3 pt-3 border-t"
						style="border-color: {borderColor}44;"
					>
						<p class="text-base opacity-80">+ {addon.label}</p>
						{#if addonDisplayPrices[i] !== null}
							<p class="text-base tabular-nums shrink-0 opacity-80">
								{formatPrice(addonDisplayPrices[i], selectedCurrency)}
							</p>
						{:else}
							<p class="text-sm opacity-60">{t('auf Anfrage', lang)}</p>
						{/if}
					</div>
					<p class="text-sm opacity-60 mt-0.5">{t(addon.billingType ?? 'Einmalig', lang)}</p>
				{/each}

				<!-- Grouped totals + grand total -->
				{#if effectiveDisplayPrice !== null}
					<div class="mt-4 pt-3 border-t" style="border-color: {borderColor};">
						{#each groupedTotals as [type, total]}
							<div class="flex justify-between text-sm mt-1">
								<span class="opacity-60">{t('Total', lang)} {t(type, lang)}:</span>
								<span class="font-semibold tabular-nums"
									>{formatPrice(total, selectedCurrency)}</span
								>
							</div>
						{/each}
						{#if grandTotal !== null && groupedTotals.length > 1}
							<div
								class="flex justify-between mt-2 pt-2 border-t"
								style="border-color: {borderColor}44;"
							>
								<span class="font-bold">{t('Total', lang)}</span>
								<span class="font-bold tabular-nums"
									>{formatPrice(grandTotal, selectedCurrency)}</span
								>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<!-- Simple single-product layout -->
				<p class="text-lg font-semibold mt-2">
					{displayLabel || (checkoutData.data['dienstleistung'] ?? '—')}
				</p>
				{#if data.priceRange && data.product?.price != null}
					<div class="mt-3 pt-3 border-t" style="border-color: {borderColor};">
						<label class="block text-sm opacity-60 mb-1" for="custom-event-price"
							>{t('Preis', lang)} ({data.baseCurrency}
							{data.product.price} – {data.priceRange})</label
						>
						<input
							id="custom-event-price"
							type="number"
							min={data.product.price}
							max={data.priceRange}
							step="1"
							bind:value={customEventPrice}
							on:change={clampEventPrice}
							class="p-2 border-b focus:border-b-2 focus:outline-none focus:ring-0 w-32"
							style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
						/>
					</div>
				{/if}
				{#if effectiveDisplayPrice !== null}
					<div class="flex justify-between mt-3 pt-3 border-t" style="border-color: {borderColor};">
						<span class="opacity-60">{data.eventTexts?.priceLabel ?? t('Preis', lang)}</span>
						<span class="font-semibold tabular-nums">
							{#if codeDiscountPct > 0}<span class="line-through opacity-40 text-base mr-1"
									>{formatPrice(displayPrice, selectedCurrency)}</span
								>{/if}{formatPrice(
								effectiveDisplayPrice,
								selectedCurrency
							)}{#if data.product?.billingType === 'Jährlich'}&thinsp;/ {t(
									'Jahr',
									lang
								)}{:else if data.product?.billingType === 'Monatlich'}&thinsp;/ {t(
									'Monat',
									lang
								)}{/if}{#if data.paymentMethods.rechnung || data.paymentMethods.bar},&nbsp;<span
									class="font-normal opacity-60"
									>{[
										data.paymentMethods.rechnung
											? (data.eventTexts?.rechnungLabel ?? t('Gegen Rechnung', lang))
											: null,
										data.paymentMethods.bar
											? (data.eventTexts?.barLabel ?? t('Gegen Bar', lang))
											: null
									]
										.filter(Boolean)
										.join(', ')}</span
								>{/if}
						</span>
					</div>
				{/if}
				{#if data.product?.billingType}
					<p class="text-sm opacity-60 mt-0.5">
						{t('Abrechnungsart:', lang)}
						<span class="font-medium" style="opacity: 1;">{t(data.product.billingType, lang)}</span>
					</p>
				{/if}
			{/if}

			{#if effectiveDisplayPrice !== null}
				{#if additionalCostDisplay}
					<div
						class="flex justify-between mt-2 pt-2 border-t"
						style="border-color: {borderColor}44;"
					>
						<span class="opacity-60">{data.additionalCostLabel ?? t('Zusatzkosten', lang)}</span>
						<span class="tabular-nums">{formatPrice(additionalCostDisplay, selectedCurrency)}</span>
					</div>
					<div
						class="flex justify-between mt-2 pt-2 border-t font-semibold"
						style="border-color: {borderColor};"
					>
						<span>{t('Total', lang)}</span>
						<span class="tabular-nums">{formatPrice(grandTotal, selectedCurrency)}</span>
					</div>
				{/if}
				<p class="text-sm opacity-60 mt-2">{t('exkl. MwSt.', lang)}</p>

				<!-- Currency selector -->
				{#if data.additionalCodes.length > 0}
					<div class="mt-3 flex items-center gap-2">
						<label for="currency-select" class="text-sm opacity-60">{t('Währung:', lang)}</label>
						<SelectField
							id="currency-select"
							bind:value={selectedCurrency}
							options={[
								data.baseCurrency,
								...data.additionalCodes.filter((c) => data.rates[c] != null)
							]}
						/>
					</div>
				{/if}

				<!-- Rabatt-Code -->
				<div class="mt-4">
					{#if appliedCode}
						<div class="flex items-center gap-3">
							<span class="text-sm" style="color: {pageColor};">
								{t('Code angewendet:', lang)} «{appliedCode}» -{codeDiscountPct}%
							</span>
							<button
								type="button"
								class="text-xs underline opacity-60 hover:opacity-100"
								on:click={removeCode}
							>
								{t('Entfernen', lang)}
							</button>
						</div>
					{:else}
						<div class="flex items-end gap-2">
							<input
								type="text"
								bind:value={discountCodeInput}
								placeholder={t('Rabatt-Code', lang)}
								class="themed-input p-2 border-b focus:border-b-2 focus:outline-none focus:ring-0 text-sm"
								style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color); width: 160px;"
								on:keydown={(e) => e.key === 'Enter' && applyDiscountCode()}
							/>
							<button
								type="button"
								class="text-sm px-3 py-1 border"
								style="border-color: {pageColor}44;"
								disabled={codeLoading || !discountCodeInput.trim()}
								on:click={applyDiscountCode}
							>
								{codeLoading ? '…' : t('Anwenden', lang)}
							</button>
						</div>
						{#if codeError}
							<p class="text-xs mt-1" style="color: #dc2626;">{codeError}</p>
						{/if}
					{/if}
				</div>
			{:else if !hasAddons}
				<p class="text-sm opacity-60 mt-1">{t('Preis wird bei Rückfrage mitgeteilt.', lang)}</p>
			{/if}
		</div>

		<!-- Ihre Angaben -->
		<div class="mb-10">
			<Heading tag="h2">{t('Ihre Angaben', lang)}</Heading>
			<dl class="divide-y" style="border-color: {borderColor}; opacity: 0.8;">
				{#each Object.entries(checkoutData.data) as [key, value]}
					{#if value && !hiddenKeys.has(key) && key !== 'dienstleistung'}
						<div class="py-3 grid grid-cols-2 gap-4">
							<dt class="font-semibold">{checkoutData.labels[key] ?? key}</dt>
							<dd>{value}</dd>
						</div>
					{/if}
				{/each}
			</dl>
		</div>

		<!-- Zahlungsart wählen -->
		<div class="mb-10">
			<Heading tag="h2">{t('Zahlungsart', lang)}</Heading>
			<div class="flex flex-col gap-4 mt-4">
				<!-- Kreditkarte / TWINT -->
				{#if data.paymentMethods.stripe}
					<label
						class="flex items-start gap-4 p-4 border cursor-pointer"
						style="border-color: {selectedPayment === 'stripe' ? pageColor : pageColor + '44'};"
					>
						<input
							type="radio"
							name="payment"
							value="stripe"
							bind:group={selectedPayment}
							class="mt-1 shrink-0"
							style="accent-color: {pageColor};"
						/>
						<div>
							<p class="font-semibold">{t('Kreditkarte / TWINT', lang)}</p>
							<p class="text-sm opacity-60 mt-0.5">
								{t('Sofortige, sichere Zahlung via Stripe.', lang)}
							</p>
						</div>
					</label>
				{/if}

				<!-- Gegen Rechnung -->
				{#if data.paymentMethods.rechnung}
					<label
						class="flex items-start gap-4 p-4 border cursor-pointer"
						style="border-color: {selectedPayment === 'rechnung' ? pageColor : pageColor + '44'};"
					>
						<input
							type="radio"
							name="payment"
							value="rechnung"
							bind:group={selectedPayment}
							class="mt-1 shrink-0"
							style="accent-color: {pageColor};"
						/>
						<div>
							<p class="font-semibold">
								{data.eventTexts?.rechnungLabel ?? t('Gegen Rechnung', lang)}
							</p>
							<p class="text-sm opacity-60 mt-0.5">
								{data.eventTexts?.rechnungDescription ??
									t('Sie erhalten eine PDF-Rechnung per E-Mail. Zahlungsfrist 30 Tage.', lang)}
							</p>
						</div>
					</label>
				{/if}

				<!-- Gegen Bar -->
				{#if data.paymentMethods.bar}
					<label
						class="flex items-start gap-4 p-4 border cursor-pointer"
						style="border-color: {selectedPayment === 'bar' ? pageColor : pageColor + '44'};"
					>
						<input
							type="radio"
							name="payment"
							value="bar"
							bind:group={selectedPayment}
							class="mt-1 shrink-0"
							style="accent-color: {pageColor};"
						/>
						<div>
							<p class="font-semibold">{data.eventTexts?.barLabel ?? t('Gegen Bar', lang)}</p>
							<p class="text-sm opacity-60 mt-0.5">
								{data.eventTexts?.barDescription ??
									data.barDescription ??
									t('Wir melden uns zur Terminvereinbarung.', lang)}
							</p>
						</div>
					</label>
				{/if}
			</div>
		</div>

		<!-- AGB -->
		<div class="mb-8">
			<label for="agb-accepted" class="flex items-start gap-3 cursor-pointer">
				<Checkbox id="agb-accepted" bind:checked={agbAccepted} />
				<span>
					{t('Ich habe die', lang)}
					<a href="/agb" class="underline">{t('AGB', lang)}</a>
					{t('und die', lang)}
					<a href="/datenschutzerklaerung" class="underline">{t('Datenschutz', lang)}</a>
					{t('gelesen und akzeptiere diese.', lang)}
				</span>
			</label>
		</div>

		<!-- Fehlermeldung -->
		{#if orderError}
			<p class="mb-4 text-red-600 text-sm">{orderError}</p>
		{/if}

		<!-- Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 items-start">
			<Button
				text={isLoading ? t('Bitte warten…', lang) : buttonText}
				link={undefined}
				disabled={!canOrder}
				color={undefined}
				bgColor={undefined}
				hoverColor={undefined}
				hoverBgColor={undefined}
				on:click={handleOrder}
			/>
			<button
				type="button"
				class="text-sm underline opacity-60 hover:opacity-100"
				on:click={() => history.back()}
			>
				{t('Weiter zum Formular', lang)}
			</button>
		</div>
	{/if}
</Bounded>

<style>
	.themed-input::placeholder {
		color: var(--page-color);
		opacity: 0.5;
	}
</style>
