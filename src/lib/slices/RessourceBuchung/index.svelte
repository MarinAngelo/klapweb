<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import RessourceKalender from '$lib/components/RessourceKalender.svelte';
	import { theme } from '$lib/stores/theme';
	import { _ } from '$lib/stores/i18n';

	export let slice: Content.RessourceBuchungSlice;
	export let context: {
		ressource?: {
			uid: string;
			name: string;
			maxPersonen: number;
			minNaechte: number;
			preisProNacht: number;
			saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
			schlafzimmer: Array<{ zimmer_name: string; bett_typ: string; anzahl_betten: number; bild: { url: string; alt: string } | null }>;
		};
		bookedRanges?: Array<{ von: string; bis: string; zimmer: string[] }>;
		lang?: string;
	};
	export const index: number = 0;

	type ZimmerItem = { zimmer_name: string; bett_typ: string; anzahl_betten: number; bild: { url: string; alt: string } | null };
	type RessourceData = {
		uid: string;
		name: string;
		maxPersonen: number;
		minNaechte: number;
		preisProNacht: number;
		saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
		schlafzimmer: ZimmerItem[];
	};

	// Ressource kommt entweder aus dem Context (ressource/[uid] Route)
	// oder wird client-seitig via ressource_link geladen (page Route)
	let ressource: RessourceData | null = context?.ressource ?? null;
	const linkedUid: string | undefined = (slice.primary as any)?.ressource_link?.uid;

	// ── State ────────────────────────────────────────────────────────────────
	let von = '';
	let bis = '';
	let personen = 1;
	let name = '';
	let email = '';
	let telefon = '';
	let nachricht = '';

	// Zimmerauswahl: Index → ausgewählt
	let zimmerSelected: boolean[] = [];
	$: if (ressource?.schlafzimmer) {
		if (zimmerSelected.length !== ressource.schlafzimmer.length) {
			zimmerSelected = ressource.schlafzimmer.map(() => true); // alle vorausgewählt
		}
	}

	// Zimmer die im gewählten Zeitraum bereits belegt sind
	$: belegteZimmerNamen = (von && bis)
		? new Set(
			bookedRanges
				.filter((r) => von < r.bis && r.von < bis)
				.flatMap((r) => r.zimmer)
		)
		: new Set<string>();

	// Wenn Datum gewählt wird: belegte Zimmer automatisch deaktivieren
	$: if (von || bis) {
		if (ressource?.schlafzimmer) {
			zimmerSelected = ressource.schlafzimmer.map((z) => {
				const name = z.zimmer_name || z.bett_typ;
				return belegteZimmerNamen.has(name) ? false : zimmerSelected[ressource!.schlafzimmer.indexOf(z)] ?? true;
			});
		}
	}

	$: selectedZimmer = (ressource?.schlafzimmer ?? []).filter((_, i) => zimmerSelected[i]);
	$: kapazitaetAusgewaehlterZimmer = selectedZimmer.reduce(
		(sum, z) => sum + (z.anzahl_betten * (z.bett_typ === 'Stockbett' ? 2 : z.bett_typ === 'Doppelbett' ? 2 : 1)),
		0
	);

	let bookedRanges: Array<{ von: string; bis: string; zimmer: string[] }> = context?.bookedRanges ?? [];
	let calendarLoading = !context?.bookedRanges;
	let loading = false;
	let success = false;
	let errorMsg = '';
	let priceError = '';

	// ── Fetch ressource + booked dates on mount ──────────────────────────────
	import { onMount } from 'svelte';
	onMount(async () => {
		const uid = ressource?.uid ?? linkedUid;
		if (!uid) return;

		// Ressource-Metadaten laden falls noch nicht via Context verfügbar
		if (!ressource && linkedUid) {
			try {
				const lang = context?.lang ?? 'de-ch';
				const res = await fetch(`/api/ressource-info?uid=${linkedUid}&lang=${lang}`);
				if (res.ok) ressource = await res.json();
			} catch {
				// non-critical
			}
		}

		// Belegte Zeiträume laden (nur wenn nicht bereits via SSR mitgeliefert)
		if (!context?.bookedRanges) {
			try {
				const res = await fetch(`/api/ressource-verfuegbarkeit?uid=${uid}`);
				if (res.ok) bookedRanges = await res.json();
			} catch {
				// non-critical
			} finally {
				calendarLoading = false;
			}
		}
	});

	// ── Price calculation ────────────────────────────────────────────────────
	function preisProNachtFuerDatum(datum: string): number {
		const saison = ressource?.saisonpreise?.find((s) => s.von <= datum && datum < s.bis);
		return saison?.preis_pro_nacht ?? ressource?.preisProNacht ?? 0;
	}

	function berechneTotal(von: string, bis: string): number {
		let total = 0;
		const current = new Date(von + 'T12:00:00Z');
		const end = new Date(bis + 'T12:00:00Z');
		while (current < end) {
			total += preisProNachtFuerDatum(current.toISOString().slice(0, 10));
			current.setUTCDate(current.getUTCDate() + 1);
		}
		return total;
	}

	function naechte(von: string, bis: string): number {
		if (!von || !bis) return 0;
		return Math.round((new Date(bis).getTime() - new Date(von).getTime()) / 86400000);
	}

$: anzahlNaechte = naechte(von, bis);
	$: totalPreis = von && bis ? berechneTotal(von, bis) : 0;
	$: preisFormatted = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalPreis);

	// ── Validation ───────────────────────────────────────────────────────────
	$: {
		priceError = '';
		if (von && bis) {
			if (von >= bis) {
				priceError = $_('Abreise muss nach Anreise liegen');
			} else if (ressource?.minNaechte && anzahlNaechte < ressource.minNaechte) {
				priceError = `${$_('Mindestaufenthalt')}: ${ressource.minNaechte} ${$_('Nächte')}`;
			} else if (selectedZimmer.length > 0 && selectedZimmer.every((z) => belegteZimmerNamen.has(z.zimmer_name || z.bett_typ))) {
				priceError = $_('Alle gewählten Zimmer sind in diesem Zeitraum belegt');
			}
		}
	}

	$: zimmerError = ressource?.schlafzimmer?.length && selectedZimmer.length === 0
		? $_('Bitte mindestens ein Zimmer auswählen')
		: personen > kapazitaetAusgewaehlterZimmer && kapazitaetAusgewaehlterZimmer > 0
		? `${$_('Ausgewählte Zimmer bieten Platz für maximal')} ${kapazitaetAusgewaehlterZimmer} ${$_('Personen')}`
		: '';

	$: today = new Date().toISOString().slice(0, 10);
	$: bisMin = von || today;
	$: formValid = von && bis && !priceError && !zimmerError && name && email && personen > 0;

	// ── Submit ───────────────────────────────────────────────────────────────
	async function handleSubmit() {
		if (!ressource || !formValid) return;
		loading = true;
		errorMsg = '';
		try {
			const res = await fetch('/api/buche-ressource', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ressourceUid: ressource.uid,
					von,
					bis,
					personen,
					zimmerauswahl: selectedZimmer,
					name,
					email,
					telefon,
					nachricht
				})
			});
			const data = await res.json();
			if (!res.ok) {
				if (data.error === 'NICHT_VERFUEGBAR') {
					errorMsg = $_('Dieser Zeitraum ist leider nicht mehr verfügbar');
					bookedRanges = [...bookedRanges, { von, bis, zimmer: selectedZimmer.map((z) => z.zimmer_name || z.bett_typ) }];
				} else {
					errorMsg = data.detail ?? data.error ?? $_('Ein Fehler ist aufgetreten');
				}
				return;
			}
			bookedRanges = [...bookedRanges, { von, bis, zimmer: selectedZimmer.map((z) => z.zimmer_name || z.bett_typ) }];
			success = true;
		} catch {
			errorMsg = $_('Ein Fehler ist aufgetreten');
		} finally {
			loading = false;
		}
	}

	$: bgColor = (slice.primary as any).bg_color || $theme.pageBgColor;
	$: textColor = (slice.primary as any).text_color || $theme.pageColor;
</script>

<Bounded
	as="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	style="background-color: {bgColor}; color: {textColor};"
>
	<div class="flex flex-col gap-8 max-w-4xl mx-auto w-full">

	{#if slice.primary.heading?.length}
		<PrismicRichText field={slice.primary.heading} />
	{/if}

	{#if slice.primary.intro?.length}
		<div class="mb-0 max-w-2xl">
			<PrismicRichText field={slice.primary.intro} />
		</div>
	{/if}

	{#if success}
		<!-- Success state -->
		<div class="max-w-xl rounded p-6" style="border: 1px solid {textColor}44;">
			<p class="text-lg font-semibold mb-2">
				{slice.primary.success_heading || $_('Anfrage erhalten!')}
			</p>
			{#if slice.primary.success_text?.length}
				<PrismicRichText field={slice.primary.success_text} />
			{:else}
				<p>{$_('Wir melden uns in Kürze bei Ihnen.')}</p>
			{/if}
		</div>
	{:else if ressource}

		<!-- Calendar -->
		<div class="rounded p-5 relative" style="border: 1px solid {textColor}22;">
			{#if calendarLoading}
				<div class="flex items-center justify-center py-12 gap-3 opacity-50 text-sm">
					<svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" style="color:{textColor};">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
					</svg>
					{$_('Verfügbarkeit wird geladen…')}
				</div>
			{:else}
			<RessourceKalender
				{bookedRanges}
				allZimmerNamen={ressource.schlafzimmer.map((z) => z.zimmer_name || z.bett_typ)}
				bind:von
				bind:bis
				{textColor}
			/>
			{/if}
		</div>

		<div class="grid md:grid-cols-2 gap-10">

			<!-- Left: Booking form -->
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">

				<!-- Date range -->
				<div class="grid grid-cols-2 gap-3">
					<label class="flex flex-col gap-1 text-sm">
						<span>{$_('Anreise')}</span>
						<input
							type="date"
							bind:value={von}
							min={today}
							required
							class="border px-3 py-2 rounded"
							style="background: transparent; color: inherit; border-color: {textColor}44;"
						/>
					</label>
					<label class="flex flex-col gap-1 text-sm">
						<span>{$_('Abreise')}</span>
						<input
							type="date"
							bind:value={bis}
							min={bisMin}
							required
							class="border px-3 py-2 rounded"
							style="background: transparent; color: inherit; border-color: {textColor}44;"
						/>
					</label>
				</div>

				{#if priceError}
					<p class="text-sm" style="color: #e53e3e;">{priceError}</p>
				{/if}

				<!-- Persons -->
				<label class="flex flex-col gap-1 text-sm">
					<span>{$_('Anzahl Personen')}</span>
					<input
						type="number"
						bind:value={personen}
						min="1"
						max={ressource.maxPersonen || undefined}
						required
						class="border px-3 py-2 rounded"
						style="background: transparent; color: inherit; border-color: {textColor}44;"
					/>
					{#if ressource.maxPersonen}
						<span class="opacity-60 text-xs">{$_('Maximal')} {ressource.maxPersonen} {$_('Personen')}</span>
					{/if}
				</label>

				<!-- Room selection -->
				{#if ressource.schlafzimmer?.length}
					<fieldset class="flex flex-col gap-2">
						<legend class="text-sm font-medium mb-1">{$_('Zimmerauswahl')}</legend>
						{#each ressource.schlafzimmer as zimmer, i}
							{@const zimmerName = zimmer.zimmer_name || zimmer.bett_typ}
							{@const belegt = belegteZimmerNamen.has(zimmerName)}
							<label
								class="flex items-center gap-3 text-sm"
								style="{belegt ? 'opacity: 0.4; cursor: not-allowed;' : 'cursor: pointer;'}"
							>
								<input
									type="checkbox"
									bind:checked={zimmerSelected[i]}
									disabled={belegt}
									class="w-4 h-4 shrink-0"
									style="accent-color: {textColor};"
								/>
								<span class="flex-1" style="{belegt ? 'text-decoration: line-through;' : ''}">{zimmerName}</span>
								<span class="opacity-60">{zimmer.anzahl_betten}× {zimmer.bett_typ}</span>
								{#if belegt && (von || bis)}
									<span class="text-xs" style="color: #991b1b;">{$_('Belegt')}</span>
								{/if}
							</label>
						{/each}
						{#if zimmerError}
							<p class="text-sm mt-1" style="color: #e53e3e;">{zimmerError}</p>
						{/if}
					</fieldset>
				{/if}

				<!-- Contact -->
				<label class="flex flex-col gap-1 text-sm">
					<span>{$_('Name')} *</span>
					<input
						type="text"
						bind:value={name}
						required
						class="border px-3 py-2 rounded"
						style="background: transparent; color: inherit; border-color: {textColor}44;"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					<span>{$_('E-Mail')} *</span>
					<input
						type="email"
						bind:value={email}
						required
						class="border px-3 py-2 rounded"
						style="background: transparent; color: inherit; border-color: {textColor}44;"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					<span>{$_('Telefon')}</span>
					<input
						type="tel"
						bind:value={telefon}
						class="border px-3 py-2 rounded"
						style="background: transparent; color: inherit; border-color: {textColor}44;"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm">
					<span>{$_('Nachricht')}</span>
					<textarea
						bind:value={nachricht}
						rows="3"
						class="border px-3 py-2 rounded resize-none"
						style="background: transparent; color: inherit; border-color: {textColor}44;"
					></textarea>
				</label>

				{#if errorMsg}
					<p class="text-sm" style="color: #e53e3e;">{errorMsg}</p>
				{/if}

				<button
					type="submit"
					disabled={!formValid || loading}
					class="px-6 py-3 font-medium transition-opacity disabled:opacity-40"
					style="background-color: {textColor}; color: {bgColor};"
				>
					{loading ? $_('Wird gesendet…') : (slice.primary.submit_label || $_('Jetzt anfragen'))}
				</button>
			</form>

			<!-- Right: Summary -->
			<div class="flex flex-col gap-6">

				<!-- Price preview -->
				{#if von && bis && !priceError}
					<div class="rounded p-5" style="border: 1px solid {textColor}22; background: {textColor}08;">
						<p class="text-sm opacity-60 mb-3">{$_('Preisvorschau')}</p>
						<div class="flex justify-between text-sm mb-1">
							<span>{anzahlNaechte} {anzahlNaechte === 1 ? $_('Nacht') : $_('Nächte')}</span>
							<span>{preisFormatted}</span>
						</div>
						<div class="flex justify-between font-semibold border-t pt-2 mt-2" style="border-color: {textColor}22;">
							<span>{$_('Total')}</span>
							<span>{preisFormatted}</span>
						</div>
					</div>
				{/if}

				<!-- Zimmer Akkordeon -->
				{#if ressource.schlafzimmer?.length}
					<div>
						<p class="text-sm font-semibold mb-2">{$_('Zimmer')}</p>
						<div class="flex flex-col gap-1">
							{#each ressource.schlafzimmer as zimmer}
								{@const zimmerName = zimmer.zimmer_name || zimmer.bett_typ}
								{@const belegt = belegteZimmerNamen.has(zimmerName)}
								<details class="rounded overflow-hidden" style="border: 1px solid {textColor}22;">
									<summary
										class="flex items-center justify-between px-3 py-2 text-sm cursor-pointer list-none"
										style="{belegt ? 'opacity:0.5;' : ''}"
									>
										<span>{zimmerName}</span>
										<span class="flex items-center gap-2 opacity-60 shrink-0 ml-2">
											{#if belegt && (von || bis)}
												<span class="text-xs" style="color:#991b1b;">{$_('Belegt')}</span>
											{/if}
											<span>{zimmer.anzahl_betten}× {zimmer.bett_typ}</span>
											<span class="text-xs">▾</span>
										</span>
									</summary>
									<div class="px-3 pb-3 pt-2 flex flex-col gap-2" style="border-top: 1px solid {textColor}11;">
										{#if zimmer.bild?.url}
											<img
												src={zimmer.bild.url}
												alt={zimmer.bild.alt || zimmerName}
												class="w-full rounded object-cover"
												style="max-height: 200px;"
											/>
										{/if}
										<p class="text-xs opacity-60">{zimmer.anzahl_betten}× {zimmer.bett_typ}</p>
									</div>
								</details>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Rules -->
				<div class="text-sm opacity-60 flex flex-col gap-1">
					{#if ressource.minNaechte > 1}
						<p>{$_('Mindestaufenthalt')}: {ressource.minNaechte} {$_('Nächte')}</p>
					{/if}
					<p>{$_('Preis pro Nacht ab')} {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(ressource.preisProNacht)}</p>
				</div>
			</div>
		</div>
	{:else}
		<p class="opacity-60 text-sm">{$_('Keine Ressource verknüpft')}</p>
	{/if}

	</div>
</Bounded>
