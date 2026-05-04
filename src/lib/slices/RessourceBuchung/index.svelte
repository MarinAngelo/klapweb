<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import RessourceKalender from '$lib/components/RessourceKalender.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { theme } from '$lib/stores/theme';
	import { _ } from '$lib/stores/i18n';
	import { onMount } from 'svelte';

	export let slice: Content.RessourceBuchungSlice;
	export let context: {
		ressource?: {
			uid: string;
			name: string;
			maxPersonen: number;
			minNaechte: number;
			preisProNacht: number;
			zimmerEinzelbuchbar: boolean;
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
		zimmerEinzelbuchbar: boolean;
		saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
		schlafzimmer: ZimmerItem[];
	};

	let ressource: RessourceData | null = context?.ressource ?? null;
	const linkedUid: string | undefined = (slice.primary as any)?.ressource_link?.uid;

	let buchungsart = 'wohnung'; // 'wohnung' | 'zimmer'
	$: isWohnung = !!(ressource?.zimmerEinzelbuchbar && (ressource?.schlafzimmer?.length ?? 0) > 0);

	// ── Step ─────────────────────────────────────────────────────────────────
	let step = 1;

	// ── State ────────────────────────────────────────────────────────────────
	let von = '';
	let bis = '';
	let personen = 1;
	let name = '';
	let email = '';
	let nachricht = '';

	let zimmerSelected: boolean[] = [];
	$: if (ressource?.schlafzimmer) {
		if (zimmerSelected.length !== ressource.schlafzimmer.length) {
			zimmerSelected = ressource.schlafzimmer.map(() => true);
		}
	}

	let bookedRanges: Array<{ von: string; bis: string; zimmer: string[] }> = context?.bookedRanges ?? [];
	let calendarLoading = !context?.bookedRanges;
	let loading = false;
	let success = false;
	let errorMsg = '';
	let priceError = '';

	$: belegteZimmerNamen = (von && bis && buchungsart === 'zimmer')
		? new Set(bookedRanges.filter((r) => von < r.bis && r.von < bis).flatMap((r) => r.zimmer))
		: new Set<string>();

	$: if ((von || bis) && buchungsart === 'zimmer') {
		if (ressource?.schlafzimmer) {
			zimmerSelected = ressource.schlafzimmer.map((z) => {
				const zName = z.zimmer_name || z.bett_typ;
				return belegteZimmerNamen.has(zName) ? false : zimmerSelected[ressource!.schlafzimmer.indexOf(z)] ?? true;
			});
		}
	}

	$: selectedZimmer = (ressource?.schlafzimmer ?? []).filter((_, i) => zimmerSelected[i]);
	$: kapazitaetAusgewaehlterZimmer = selectedZimmer.reduce(
		(sum, z) => sum + (z.bett_typ === 'Stockbett' ? z.anzahl_betten * 2 : z.bett_typ === 'Doppelbett' ? z.anzahl_betten * 2 : z.anzahl_betten),
		0
	);

	// Im Wohnung-Modus alle Buchungen als voll belegt anzeigen (auch Teilbuchungen blockieren)
	$: calendarBookedRanges = buchungsart === 'wohnung'
		? bookedRanges.map((r) => ({ von: r.von, bis: r.bis, zimmer: [] as string[] }))
		: bookedRanges;

	onMount(() => {
		const uid = ressource?.uid ?? linkedUid;
		if (!uid) return;

		async function refreshVerfuegbarkeit() {
			try {
				const res = await fetch(`/api/ressource-verfuegbarkeit?uid=${uid}`);
				if (res.ok) bookedRanges = await res.json();
			} catch { /* non-critical */ } finally {
				calendarLoading = false;
			}
		}

		async function init() {
			if (!ressource && linkedUid) {
				try {
					const lang = context?.lang ?? 'de-ch';
					const res = await fetch(`/api/ressource-info?uid=${linkedUid}&lang=${lang}`);
					if (res.ok) ressource = await res.json();
				} catch { /* non-critical */ }
			}
			if (!context?.bookedRanges) await refreshVerfuegbarkeit();
		}

		init();

		function onVisibilityChange() {
			if (document.visibilityState === 'visible') refreshVerfuegbarkeit();
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		const pollInterval = setInterval(refreshVerfuegbarkeit, 5 * 60 * 1000);

		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
			clearInterval(pollInterval);
		};
	});

	// ── Price calculation ────────────────────────────────────────────────────
	function preisProNachtFuerDatum(datum: string): number {
		const saison = ressource?.saisonpreise?.find((s) => s.von <= datum && datum < s.bis);
		return saison?.preis_pro_nacht ?? ressource?.preisProNacht ?? 0;
	}

	function berechneTotal(vonDate: string, bisDate: string): number {
		let total = 0;
		const current = new Date(vonDate + 'T12:00:00Z');
		const end = new Date(bisDate + 'T12:00:00Z');
		while (current < end) {
			total += preisProNachtFuerDatum(current.toISOString().slice(0, 10));
			current.setUTCDate(current.getUTCDate() + 1);
		}
		return total;
	}

	function naechte(vonDate: string, bisDate: string): number {
		if (!vonDate || !bisDate) return 0;
		return Math.round((new Date(bisDate).getTime() - new Date(vonDate).getTime()) / 86400000);
	}

	$: anzahlNaechte = naechte(von, bis);
	$: totalPreis = von && bis ? berechneTotal(von, bis) : 0;
	$: preisFormatted = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(totalPreis);

	function formatDate(d: string): string {
		if (!d) return '';
		return new Date(d + 'T12:00:00Z').toLocaleDateString('de-CH', {
			day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
		});
	}

	// ── Validation ───────────────────────────────────────────────────────────
	$: {
		priceError = '';
		if (von && bis) {
			if (von >= bis) {
				priceError = $_('Abreise muss nach Anreise liegen');
			} else if (ressource?.minNaechte && anzahlNaechte < ressource.minNaechte) {
				priceError = `${$_('Mindestaufenthalt')}: ${ressource.minNaechte} ${$_('Nächte')}`;
			}
		}
	}

	$: showZimmerSelection = buchungsart === 'zimmer' && (ressource?.schlafzimmer?.length ?? 0) > 0;
	$: zimmerError = showZimmerSelection && selectedZimmer.length === 0
		? $_('Bitte mindestens ein Zimmer auswählen')
		: personen > kapazitaetAusgewaehlterZimmer && kapazitaetAusgewaehlterZimmer > 0 && showZimmerSelection
		? `${$_('Ausgewählte Zimmer bieten Platz für maximal')} ${kapazitaetAusgewaehlterZimmer} ${$_('Personen')}`
		: '';

	$: today = new Date().toISOString().slice(0, 10);
	$: bisMin = von || today;


	$: step1Valid = !!(von && bis && !priceError && !zimmerError && personen > 0);
	$: formValid = !!(step1Valid && name && email && telefon);

	function goToStep2() {
		if (step1Valid) step = 2;
	}
	function backToStep1() {
		step = 1;
		errorMsg = '';
	}

	// ── Submit ───────────────────────────────────────────────────────────────
	async function handleSubmit() {
		if (!ressource || !formValid) return;
		loading = true;
		errorMsg = '';

		const zimmerToSubmit = buchungsart === 'zimmer' ? selectedZimmer : [];

		try {
			const res = await fetch('/api/buche-ressource', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ressourceUid: ressource.uid,
					von,
					bis,
					personen,
					zimmerauswahl: zimmerToSubmit,
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
					bookedRanges = [...bookedRanges, { von, bis, zimmer: [] }];
				} else {
					errorMsg = data.detail ?? data.error ?? $_('Ein Fehler ist aufgetreten');
				}
				return;
			}
			bookedRanges = [...bookedRanges, { von, bis, zimmer: zimmerToSubmit.map((z) => z.zimmer_name || z.bett_typ) }];
			success = true;
		} catch {
			errorMsg = $_('Ein Fehler ist aufgetreten');
		} finally {
			loading = false;
		}
	}

	function switchBuchungsart(art: string) {
		buchungsart = art;
		von = ''; bis = '';
		zimmerSelected = (ressource?.schlafzimmer ?? []).map(() => true);
	}

	$: bgColor = (slice.primary as any).bg_color || $theme.pageBgColor;
	$: textColor = (slice.primary as any).text_color || $theme.pageColor;

	// Telefon: Vorwahl + Nummer
	const countryPrefixes = [
		{ prefix: '+41', label: '🇨🇭 +41' },
		{ prefix: '+49', label: '🇩🇪 +49' },
		{ prefix: '+43', label: '🇦🇹 +43' },
		{ prefix: '+33', label: '🇫🇷 +33' },
		{ prefix: '+39', label: '🇮🇹 +39' },
		{ prefix: '+44', label: '🇬🇧 +44' },
		{ prefix: '+1', label: '🇺🇸 +1' },
		{ prefix: '+34', label: '🇪🇸 +34' },
		{ prefix: '+31', label: '🇳🇱 +31' },
		{ prefix: '+32', label: '🇧🇪 +32' },
		{ prefix: '+352', label: '🇱🇺 +352' },
		{ prefix: '+48', label: '🇵🇱 +48' },
		{ prefix: '+351', label: '🇵🇹 +351' },
		{ prefix: '+420', label: '🇨🇿 +420' },
		{ prefix: '+7', label: '🇷🇺 +7' },
		{ prefix: '+90', label: '🇹🇷 +90' },
		{ prefix: '+86', label: '🇨🇳 +86' },
		{ prefix: '+81', label: '🇯🇵 +81' },
		{ prefix: '+82', label: '🇰🇷 +82' },
		{ prefix: '+91', label: '🇮🇳 +91' },
		{ prefix: '+55', label: '🇧🇷 +55' },
		{ prefix: '+52', label: '🇲🇽 +52' },
		{ prefix: '+54', label: '🇦🇷 +54' },
		{ prefix: '+61', label: '🇦🇺 +61' },
		{ prefix: '+64', label: '🇳🇿 +64' },
		{ prefix: '+27', label: '🇿🇦 +27' },
		{ prefix: '+971', label: '🇦🇪 +971' },
		{ prefix: '+966', label: '🇸🇦 +966' },
		{ prefix: '+20', label: '🇪🇬 +20' }
	];
	let telefonPrefix = '+41';
	let telefonNummer = '';
	$: telefon = telefonNummer ? `${telefonPrefix} ${telefonNummer}` : '';
</script>

<Bounded
	as="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	style="background-color: {bgColor}; color: {textColor};"
>
	<div class="flex flex-col gap-8 w-full">

	{#if slice.primary.heading?.length}
		<PrismicRichText field={slice.primary.heading} />
	{/if}

	{#if slice.primary.intro?.length}
		<div class="mb-0 max-w-2xl">
			<PrismicRichText field={slice.primary.intro} />
		</div>
	{/if}

	{#if calendarLoading}
		<div class="flex items-center justify-center py-20 gap-3 text-sm opacity-60">
			<svg class="animate-spin w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" style="color:{textColor};">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
			</svg>
			{$_('Verfügbarkeit wird geladen…')}
		</div>
	{:else if success}
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

		<!-- Step indicator -->
		<div class="flex items-center gap-3 text-sm">
			<div class="flex items-center gap-2">
				<span
					class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
					style="background-color: {textColor}; color: {bgColor};"
				>1</span>
				<span class="font-medium">{$_('Verfügbarkeit')}</span>
			</div>
			<div class="flex-1 h-px opacity-30" style="background-color: {textColor};"></div>
			<div class="flex items-center gap-2">
				<span
					class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
					style="background-color: {step === 2 ? textColor : 'transparent'}; color: {step === 2 ? bgColor : textColor}; border: 2px solid {textColor}; opacity: {step === 2 ? 1 : 0.4};"
				>2</span>
				<span style="opacity: {step === 2 ? 1 : 0.4};">{$_('Kontakt')}</span>
			</div>
		</div>

		<!-- ── STEP 1: Verfügbarkeit, Zeitraum, Zimmer ── -->
		{#if step === 1}

			<!-- Buchungsart-Toggle -->
			{#if isWohnung}
				<div class="flex gap-2">
					<button
						type="button"
						on:click={() => switchBuchungsart('wohnung')}
						class="px-4 py-2 rounded text-sm font-medium transition-all"
						style="background-color: {buchungsart === 'wohnung' ? textColor : 'transparent'}; color: {buchungsart === 'wohnung' ? bgColor : textColor}; border: 1px solid {textColor}44;"
					>{$_('Ganze Wohnung')}</button>
					<button
						type="button"
						on:click={() => switchBuchungsart('zimmer')}
						class="px-4 py-2 rounded text-sm font-medium transition-all"
						style="background-color: {buchungsart === 'zimmer' ? textColor : 'transparent'}; color: {buchungsart === 'zimmer' ? bgColor : textColor}; border: 1px solid {textColor}44;"
					>{$_('Einzelzimmer')}</button>
				</div>
			{/if}

			<!-- Infoleiste -->
		{#if ressource?.minNaechte > 1 || ressource?.preisProNacht}
			<div class="flex flex-wrap gap-6 text-base">
				{#if ressource?.preisProNacht}
					<span>{$_('Preis pro Nacht ab')} <strong>{new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(ressource.preisProNacht)}</strong></span>
				{/if}
				{#if ressource?.minNaechte > 1}
					<span>{$_('Mindestaufenthalt')}: <strong>{ressource.minNaechte} {$_('Nächte')}</strong></span>
				{/if}
			</div>
		{/if}

		<!-- Calendar -->
			<div class="rounded p-5 relative" style="background: #83bd69; border: 1px solid {textColor}22;">
				<RessourceKalender
					bookedRanges={calendarBookedRanges}
					allZimmerNamen={(ressource?.schlafzimmer ?? []).map((z) => z.zimmer_name || z.bett_typ)}
					bind:von
					bind:bis
					{textColor}
				/>
			</div>

			<div class="grid md:grid-cols-2 gap-10">

				<!-- Left: Zeitraum + Personen + Zimmerauswahl -->
				<div class="flex flex-col gap-5">

					<!-- Date range -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="von" class="block text-base font-bold">{$_('Anreise')} *</label>
							<input
								id="von"
								type="date"
								bind:value={von}
								min={today}
								required
								class="input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
								style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
							/>
						</div>
						<div>
							<label for="bis" class="block text-base font-bold">{$_('Abreise')} *</label>
							<input
								id="bis"
								type="date"
								bind:value={bis}
								min={bisMin}
								required
								class="input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
								style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
							/>
						</div>
					</div>

					{#if priceError}
						<p class="text-sm" style="color: #e53e3e;">{priceError}</p>
					{/if}

					<!-- Personen -->
					<div>
						<label for="personen" class="block text-base font-bold">{$_('Anzahl Personen')} *</label>
						<input
							id="personen"
							type="number"
							bind:value={personen}
							min="1"
							max={ressource?.maxPersonen || undefined}
							required
							class="input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
							style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
						/>
						{#if ressource?.maxPersonen}
							<span class="opacity-60 text-xs">{$_('Maximal')} {ressource.maxPersonen} {$_('Personen')}</span>
						{/if}
					</div>

					<!-- Zimmer-Auswahl (nur im Einzelzimmer-Modus) -->
					{#if showZimmerSelection}
						<fieldset class="flex flex-col gap-2">
							<legend class="block text-base font-bold mb-1">{$_('Zimmerauswahl')}</legend>
							{#each (ressource?.schlafzimmer ?? []) as zimmer, i}
								{@const zimmerName = zimmer.zimmer_name || zimmer.bett_typ}
								{@const belegt = belegteZimmerNamen.has(zimmerName)}
								<label
									for="zimmer-{i}"
									class="flex items-center gap-3 text-sm"
									style="{belegt ? 'opacity: 0.4; cursor: not-allowed;' : 'cursor: pointer;'}"
								>
									<Checkbox id="zimmer-{i}" bind:checked={zimmerSelected[i]} disabled={belegt} />
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

					<!-- Weiter-Button -->
					<button
						type="button"
						on:click={goToStep2}
						disabled={!step1Valid}
						class="mt-2 px-6 py-3 font-medium transition-opacity disabled:opacity-40"
						style="background-color: {textColor}; color: {bgColor};"
					>
						{$_('Weiter')} →
					</button>
				</div>

				<!-- Right: Zimmer Akkordeon + Preisvorschau + Regeln -->
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
					{#if (ressource?.schlafzimmer?.length ?? 0) > 0}
						<div>
							<p class="text-sm font-semibold mb-2">{$_('Zimmer')}</p>
							<div class="flex flex-col gap-1">
								{#each ressource?.schlafzimmer ?? [] as zimmer}
									{@const zimmerName = zimmer.zimmer_name || zimmer.bett_typ}
									<details class="rounded overflow-hidden" style="border: 1px solid {textColor}22;">
										<summary class="flex items-center justify-between px-3 py-2 text-sm cursor-pointer list-none">
											<span>{zimmerName}</span>
											<span class="flex items-center gap-2 opacity-60 shrink-0 ml-2">
												<span>{zimmer.anzahl_betten}× {zimmer.bett_typ}</span>
												<span class="text-xs">▾</span>
											</span>
										</summary>
										<div class="px-3 pb-3 pt-2 flex flex-col gap-2" style="border-top: 1px solid {textColor}11;">
											{#if zimmer.bild?.url}
												<img src={zimmer.bild.url} alt={zimmer.bild.alt || zimmerName}
													class="w-full rounded object-cover" style="max-height: 200px;" />
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
						{#if (ressource?.minNaechte ?? 0) > 1}
							<p>{$_('Mindestaufenthalt')}: {ressource?.minNaechte} {$_('Nächte')}</p>
						{/if}
						{#if ressource?.preisProNacht}
							<p>{$_('Preis pro Nacht ab')} {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(ressource.preisProNacht)}</p>
						{/if}
					</div>
				</div>
			</div>

		<!-- ── STEP 2: Kontaktformular ── -->
		{:else}

			<!-- Buchungs-Zusammenfassung -->
			<div class="rounded p-5 flex flex-col gap-2" style="border: 1px solid {textColor}22; background: {textColor}06;">
				<p class="text-sm font-semibold mb-1">{$_('Ihre Auswahl')}</p>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
					<div>
						<p class="opacity-60 text-xs">{$_('Anreise')}</p>
						<p class="font-medium">{formatDate(von)}</p>
					</div>
					<div>
						<p class="opacity-60 text-xs">{$_('Abreise')}</p>
						<p class="font-medium">{formatDate(bis)}</p>
					</div>
					<div>
						<p class="opacity-60 text-xs">{$_('Nächte')}</p>
						<p class="font-medium">{anzahlNaechte}</p>
					</div>
					<div>
						<p class="opacity-60 text-xs">{$_('Personen')}</p>
						<p class="font-medium">{personen}</p>
					</div>
				</div>
				{#if showZimmerSelection && selectedZimmer.length > 0}
					<p class="text-xs opacity-60 mt-1">{$_('Zimmer')}: {selectedZimmer.map((z) => z.zimmer_name || z.bett_typ).join(', ')}</p>
				{/if}
				{#if totalPreis > 0}
					<p class="text-sm font-semibold mt-1">{$_('Total')}: {preisFormatted}</p>
				{/if}
				<button type="button" on:click={backToStep1} class="text-xs underline opacity-60 hover:opacity-100 text-left mt-1 w-fit">
					← {$_('Auswahl ändern')}
				</button>
			</div>

			<!-- Kontaktformular -->
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-5 max-w-lg">

				<div>
					<label for="name" class="block text-base font-bold">{$_('Name')} *</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						class="input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
						style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
					/>
				</div>

				<div>
					<label for="email" class="block text-base font-bold">{$_('E-Mail')} *</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm"
						style="background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);"
					/>
				</div>

				<div>
					<label for="telefon-nr" class="block text-base font-bold">{$_('Telefon')} *</label>
					<div class="flex items-end mt-1 border-b focus-within:border-b-2" style="border-bottom-color: var(--page-color);">
						<select
							bind:value={telefonPrefix}
							class="input p-2 shrink-0 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
							style="background-color: var(--page-bg-color); color: var(--page-color); border: none;"
						>
							{#each countryPrefixes as cp}
								<option value={cp.prefix}>{cp.label}</option>
							{/each}
						</select>
						<input
							id="telefon-nr"
							type="tel"
							bind:value={telefonNummer}
							required
							class="input p-2 flex-1 focus:outline-none focus:ring-0"
							style="background-color: var(--page-bg-color); color: var(--page-color); border: none;"
						/>
					</div>
				</div>

				<div>
					<label for="nachricht" class="block text-base font-bold">{$_('Nachricht')}</label>
					<div class="border-b focus-within:border-b-2" style="border-bottom-color: var(--page-color);">
						<textarea
							id="nachricht"
							bind:value={nachricht}
							rows="4"
							class="input mt-1 p-2 block w-full rounded-md focus:outline-none focus:ring-0 resize-none"
							style="background-color: var(--page-bg-color); color: var(--page-color);"
						></textarea>
					</div>
				</div>

				{#if errorMsg}
					<p class="text-sm" style="color: #e53e3e;">{errorMsg}</p>
				{/if}

				<div class="flex gap-3 flex-wrap pt-2">
					<button
						type="button"
						on:click={backToStep1}
						class="px-6 py-3 font-medium transition-opacity"
						style="background-color: transparent; color: {textColor}; border: 1px solid {textColor}44;"
					>
						← {$_('Zurück')}
					</button>
					<button
						type="submit"
						disabled={!formValid || loading}
						class="px-6 py-3 font-medium transition-opacity disabled:opacity-40"
						style="background-color: {textColor}; color: {bgColor};"
					>
						{loading ? $_('Wird gesendet…') : (slice.primary.submit_label || $_('Jetzt anfragen'))}
					</button>
				</div>
			</form>

		{/if}

	{:else}
		<p class="opacity-60 text-sm">{$_('Keine Ressource verknüpft')}</p>
	{/if}

	</div>
</Bounded>

<style>
	.input {
		font-size: 18px;
		line-height: 1.5;
	}
</style>
