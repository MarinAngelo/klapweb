<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';
	import { get } from 'svelte/store';
	import Bounded from '$lib/components/Bounded.svelte';
	import Heading from '$lib/components/Heading.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatPriceChf } from '$lib/pricing';
	import type { ProductData } from './+page.server';

	export let data: { product: ProductData | null };

	interface CheckoutData {
		data: Record<string, string>;
		labels: Record<string, string>;
	}

	let checkoutData: CheckoutData | null = null;
	let agbAccepted = false;
	let selectedPayment: 'stripe' | 'rechnung' | 'bar' | null = null;
	let isLoading = false;
	let orderError: string | null = null;

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
	});

	$: serviceKey = checkoutData?.data['dienstleistung'] ?? '';
	$: displayLabel = data.product?.label ?? serviceKey;
	$: displayPrice = data.product?.price ?? null;

	$: stripeUrl =
		data.product?.stripeUrl && checkoutData?.data['email']
			? `${data.product.stripeUrl}?prefilled_email=${encodeURIComponent(checkoutData.data['email'])}`
			: (data.product?.stripeUrl ?? '');

	$: stripeTarget = import.meta.env.DEV
		? `/beauftragung/bestaetigung?simulated=true&service=${encodeURIComponent(serviceKey)}&label=${encodeURIComponent(displayLabel)}`
		: stripeUrl;

	$: buttonText =
		selectedPayment === 'stripe'
			? 'Kostenpflichtig bestellen'
			: selectedPayment === 'rechnung'
				? 'Rechnung anfordern'
				: selectedPayment === 'bar'
					? 'Bestellung absenden'
					: 'Bitte Zahlungsart wählen';

	$: canOrder = agbAccepted && selectedPayment !== null && !isLoading;

	async function handleOrder() {
		if (!canOrder || !checkoutData) return;
		isLoading = true;
		orderError = null;

		const serviceParam = encodeURIComponent(serviceKey);
		const labelParam = encodeURIComponent(displayLabel);

		if (selectedPayment === 'stripe') {
			sessionStorage.removeItem('checkoutData');
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
						serviceKey
					})
				});
				if (!resp.ok) {
					const err = await resp.json().catch(() => ({}));
					orderError = (err as { error?: string }).error ?? 'Ein Fehler ist aufgetreten.';
					isLoading = false;
					return;
				}
				sessionStorage.removeItem('checkoutData');
				goto(`/beauftragung/bestaetigung?method=rechnung&service=${serviceParam}&label=${labelParam}`);
			} catch {
				orderError = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
				isLoading = false;
			}
			return;
		}

		if (selectedPayment === 'bar') {
			// Dev-Modus: Netlify-POST überspringen
			if (import.meta.env.DEV) {
				sessionStorage.removeItem('checkoutData');
				goto(`/beauftragung/bestaetigung?method=bar&service=${serviceParam}&label=${labelParam}`);
				return;
			}
			try {
				const params = new URLSearchParams();
				params.set('form-name', 'beauftragung_bar');
				for (const [k, v] of Object.entries(checkoutData.data)) {
					params.set(k, v);
				}
				const resp = await fetch('/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: params.toString()
				});
				if (!resp.ok) {
					orderError = 'Übermittlung fehlgeschlagen. Bitte versuchen Sie es erneut.';
					isLoading = false;
					return;
				}
				sessionStorage.removeItem('checkoutData');
				goto(`/beauftragung/bestaetigung?method=bar&service=${serviceParam}&label=${labelParam}`);
			} catch {
				orderError = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
				isLoading = false;
			}
		}
	}

	$: bgColor = get(theme).pageBgColor;
	$: pageColor = get(theme).pageColor;
	$: borderColor = get(theme).pageColor;
</script>

<svelte:head>
	<title>Bestellübersicht</title>
</svelte:head>

<Bounded as="section" style="background-color: {bgColor}; color: {pageColor};">
	{#if !checkoutData}
		<p>Laden…</p>
	{:else}
		<Heading tag="h1">Bestellübersicht</Heading>

		<!-- Dienstleistung + Preis -->
		<div class="mb-10 p-6 border" style="border-color: {borderColor};">
			<p class="text-sm uppercase tracking-wide opacity-60 mb-1">Ihre Bestellung</p>
			<p class="text-xl font-semibold">{displayLabel || (checkoutData.data['dienstleistung'] ?? '—')}</p>
			{#if displayPrice !== null}
				<p class="text-3xl font-bold mt-1">{formatPriceChf(displayPrice)}</p>
				<p class="text-sm opacity-60 mt-1">exkl. MwSt.</p>
			{:else}
				<p class="text-sm opacity-60 mt-1">Preis wird bei Rückfrage mitgeteilt.</p>
			{/if}
		</div>

		<!-- Ihre Angaben -->
		<div class="mb-10">
			<Heading tag="h2">Ihre Angaben</Heading>
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
			<Heading tag="h2">Zahlungsart</Heading>
			<div class="flex flex-col gap-4 mt-4">
				<!-- Kreditkarte / TWINT -->
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
						<p class="font-semibold">Kreditkarte / TWINT</p>
						<p class="text-sm opacity-60 mt-0.5">Sofortige, sichere Zahlung via Stripe.</p>
					</div>
				</label>

				<!-- Gegen Rechnung -->
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
						<p class="font-semibold">Gegen Rechnung</p>
						<p class="text-sm opacity-60 mt-0.5">
							Sie erhalten eine PDF-Rechnung per E-Mail. Zahlungsfrist 30 Tage.
						</p>
					</div>
				</label>

				<!-- Gegen Bar -->
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
						<p class="font-semibold">Gegen Bar</p>
						<p class="text-sm opacity-60 mt-0.5">Wir melden uns zur Terminvereinbarung.</p>
					</div>
				</label>
			</div>
		</div>

		<!-- AGB -->
		<div class="mb-8">
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={agbAccepted}
					class="mt-1 h-5 w-5 cursor-pointer shrink-0"
					style="accent-color: {pageColor};"
				/>
				<span>
					Ich habe die
					<a href="/agb" class="underline">AGB</a>
					und die
					<a href="/datenschutzerklaerung" class="underline">Datenschutzerklärung</a>
					gelesen und akzeptiere diese.
				</span>
			</label>
		</div>

		<!-- Fehlermeldung -->
		{#if orderError}
			<p class="mb-4 text-red-600 text-sm">{orderError}</p>
		{/if}

		<!-- DEV-Hinweis -->
		{#if import.meta.env.DEV}
			<p class="text-xs mb-3 px-2 py-1 border border-yellow-500 text-yellow-600 inline-block">
				DEV: Stripe → lokale Erfolgsseite · Rechnung → PDF ohne E-Mail · Bar → kein Netlify-POST
			</p>
		{/if}

		<!-- Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 items-start">
			<Button
				text={isLoading ? 'Bitte warten…' : buttonText}
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
				Zurück zum Formular
			</button>
		</div>
	{/if}
</Bounded>
