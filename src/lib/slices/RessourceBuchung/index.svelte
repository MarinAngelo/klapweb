<script lang="ts">
	import { page } from '$app/stores';
	import type { Content } from '@prismicio/client';
	import { PrismicRichText } from '@prismicio/svelte';
	import RichTextEmbed from '$lib/components/PrismicRichText/Embed.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import RessourceKalender from '$lib/components/RessourceKalender.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import InputField from '$lib/components/InputField.svelte';
	import { theme } from '$lib/stores/theme';
	import { _ } from '$lib/stores/i18n';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import { onMount } from 'svelte';

	export let slice: Content.RessourceBuchungSlice;
	export let context: {
		ressource?: {
			uid: string;
			name: string;
			beschreibung: any[];
			maxPersonen: number;
			minNaechte: number;
			preisProNacht: number;
			zimmerEinzelbuchbar: boolean;
			saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
			schlafzimmer: Array<{
				zimmer_name: string;
				bett_typ: string;
				anzahl_betten: number;
				bild: { url: string; alt: string } | null;
			}>;
		};
		bookedRanges?: Array<{ von: string; bis: string; zimmer: string[] }>;
		lang?: string;
	};
	export const index: number = 0;

	type ZimmerItem = {
		zimmer_name: string;
		bett_typ: string;
		anzahl_betten: number;
		bild: { url: string; alt: string } | null;
	};
	type RessourceData = {
		uid: string;
		name: string;
		beschreibung: any[];
		maxPersonen: number;
		minNaechte: number;
		preisProNacht: number;
		zimmerEinzelbuchbar: boolean;
		saisonpreise: Array<{ von: string; bis: string; preis_pro_nacht: number }>;
		schlafzimmer: ZimmerItem[];
	};

	let ressource: RessourceData | null = context?.ressource ?? null;
	const linkedUid: string | undefined = (slice.primary as any)?.ressource_link?.uid;

	let buchungsart = 'zimmer'; // 'wohnung' | 'zimmer'
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
			zimmerSelected = ressource.schlafzimmer.map(() => false);
		}
	}

	let bookedRanges: Array<{ von: string; bis: string; zimmer: string[] }> =
		context?.bookedRanges ?? [];
	let calendarLoading = !context?.bookedRanges;
	let loading = false;
	let success = false;
	let errorMsg = '';
	let priceError = '';

	$: belegteZimmerNamen =
		von && bis && buchungsart === 'zimmer'
			? new Set(bookedRanges.filter((r) => von < r.bis && r.von < bis).flatMap((r) => r.zimmer))
			: new Set<string>();

	$: if ((von || bis) && buchungsart === 'zimmer') {
		if (ressource?.schlafzimmer) {
			zimmerSelected = ressource.schlafzimmer.map((z) => {
				const zName = z.zimmer_name || z.bett_typ;
				return belegteZimmerNamen.has(zName)
					? false
					: (zimmerSelected[ressource!.schlafzimmer.indexOf(z)] ?? true);
			});
		}
	}

	$: selectedZimmer = (ressource?.schlafzimmer ?? []).filter((_, i) => zimmerSelected[i]);
	$: kapazitaetAusgewaehlterZimmer = selectedZimmer.reduce(
		(sum, z) =>
			sum +
			(z.bett_typ === 'Stockbett'
				? z.anzahl_betten * 2
				: z.bett_typ === 'Doppelbett'
					? z.anzahl_betten * 2
					: z.anzahl_betten),
		0
	);

	// Im Wohnung-Modus alle Buchungen als voll belegt anzeigen (auch Teilbuchungen blockieren)
	$: calendarBookedRanges =
		buchungsart === 'wohnung'
			? bookedRanges.map((r) => ({ von: r.von, bis: r.bis, zimmer: [] as string[] }))
			: bookedRanges;

	onMount(() => {
		const uid = ressource?.uid ?? linkedUid;
		if (!uid) return;

		async function refreshVerfuegbarkeit() {
			try {
				const res = await fetch(`/api/ressource-verfuegbarkeit?uid=${uid}`);
				if (res.ok) bookedRanges = await res.json();
			} catch {
				/* non-critical */
			} finally {
				calendarLoading = false;
			}
		}

		async function init() {
			if (!ressource && linkedUid) {
				try {
					const lang = context?.lang ?? 'de-ch';
					const res = await fetch(`/api/ressource-info?uid=${linkedUid}&lang=${lang}`);
					if (res.ok) ressource = await res.json();
				} catch {
					/* non-critical */
				}
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
	$: zimmerFaktor = buchungsart === 'zimmer' ? selectedZimmer.length : anzahlZimmer;
	$: totalPreis = von && bis ? berechneTotal(von, bis) * Math.max(1, zimmerFaktor) : 0;
	import { formatDateShort } from '$lib/utils/formatDate';

	$: preisFormatted = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
		totalPreis
	);

	const formatDate = formatDateShort;

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

	$: showZimmerSelection =
		!!ressource?.zimmerEinzelbuchbar &&
		buchungsart === 'zimmer' &&
		(ressource?.schlafzimmer?.length ?? 0) > 0;
	$: zimmerError =
		showZimmerSelection && selectedZimmer.length === 0
			? $_('Bitte mindestens ein Zimmer auswählen')
			: personen > kapazitaetAusgewaehlterZimmer &&
				  kapazitaetAusgewaehlterZimmer > 0 &&
				  showZimmerSelection
				? `${$_('Ausgewählte Zimmer bieten Platz für maximal')} ${kapazitaetAusgewaehlterZimmer} ${$_('Personen')}`
				: '';

	$: today = new Date().toISOString().slice(0, 10);
	$: bisMin = von || today;

	$: step1Valid = !!(von && bis && !priceError && !zimmerError && personen > 0);
	$: referenzEmailValid = !referenzEmail ? true : referenzEmailFound === true;
	$: formValid = !!(step1Valid && name && email && telefon && referenzEmailValid);

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
					nachricht,
					lang: context?.lang ?? $page.data?.lang
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
			bookedRanges = [
				...bookedRanges,
				{ von, bis, zimmer: zimmerToSubmit.map((z) => z.zimmer_name || z.bett_typ) }
			];
			success = true;
		} catch {
			errorMsg = $_('Ein Fehler ist aufgetreten');
		} finally {
			loading = false;
		}
	}

	function switchBuchungsart(art: string) {
		buchungsart = art;
		von = '';
		bis = '';
		zimmerSelected = (ressource?.schlafzimmer ?? []).map(() => false);
	}

	$: anzahlZimmer = ressource?.schlafzimmer?.length ?? 1;
	$: preisProNachtAnzeige = ressource
		? buchungsart === 'wohnung' && anzahlZimmer > 1
			? ressource.preisProNacht * anzahlZimmer
			: ressource.preisProNacht
		: 0;

	$: bgColor = (slice.primary as any).bg_color || $theme.pageBgColor;
	$: textColor = (slice.primary as any).text_color || $theme.pageColor;

	let telefon = '';
	let referenzEmail = '';
	let referenzEmailFound: boolean | null = null;
	let referenzEmailChecking = false;
	let referenzEmailTimer: ReturnType<typeof setTimeout>;

	function checkReferenzEmail(val: string) {
		clearTimeout(referenzEmailTimer);
		referenzEmailFound = null;
		if (!val || !val.includes('@')) return;
		referenzEmailChecking = true;
		referenzEmailTimer = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/check-referenz-email?email=${encodeURIComponent(val.trim())}`
				);
				const data = await res.json();
				referenzEmailFound = data.found as boolean;
			} catch {
				referenzEmailFound = null;
			} finally {
				referenzEmailChecking = false;
			}
		}, 150);
	}

	$: checkReferenzEmail(referenzEmail);
</script>

<Bounded
	as="section"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="color-scope"
	style="--scope-color: {textColor}; --scope-bg: {bgColor};"
>
	<div class="flex flex-col gap-8 w-full">
		{#if slice.primary.heading?.length}
			<PrismicRichText field={slice.primary.heading} components={{ embed: RichTextEmbed }} />
		{/if}

		{#if slice.primary.intro?.length}
			<div class="mb-0 max-w-2xl">
				<PrismicRichText field={slice.primary.intro} components={{ embed: RichTextEmbed }} />
			</div>
		{/if}

		{#if calendarLoading}
			<div class="flex items-center justify-center py-20 gap-3 text-sm text-muted">
				<svg class="animate-spin w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
				</svg>
				{$_('Verfügbarkeit wird geladen…')}
			</div>
		{:else if success}
			<div class="scope-border-strong max-w-xl rounded border p-6">
				<p class="text-lg font-semibold mb-2">
					{slice.primary.success_heading || $_('Anfrage erhalten!')}
				</p>
				{#if slice.primary.success_text?.length}
					<PrismicRichText
						field={slice.primary.success_text}
						components={{ embed: RichTextEmbed }}
					/>
				{:else}
					<p>{$_('Wir melden uns in Kürze bei Ihnen.')}</p>
				{/if}
			</div>
		{:else if ressource}
			<!-- Step indicator -->
			<div class="flex items-center gap-3 text-sm">
				<div class="flex items-center gap-2">
					<span
						class="scope-btn-solid w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
						>1</span
					>
					<span class="font-medium">{$_('Verfügbarkeit')}</span>
				</div>
				<div class="scope-fill flex-1 h-px opacity-30"></div>
				<div class="flex items-center gap-2">
					<span
						class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all border-2 scope-border-solid {step ===
						2
							? 'scope-btn-solid'
							: 'scope-text opacity-40'}">2</span
					>
					<span class:opacity-40={step !== 2}>{$_('Kontakt')}</span>
				</div>
			</div>

			<!-- ── STEP 1: Verfügbarkeit, Zeitraum, Zimmer ── -->
			{#if step === 1}
				<!-- Buchungsart-Toggle -->
				{#if isWohnung}
					<div class="flex gap-2">
						<button
							type="button"
							on:click={() => switchBuchungsart('zimmer')}
							class="px-4 py-2 rounded text-sm font-medium transition-all {buchungsart === 'zimmer'
								? 'scope-btn-solid'
								: 'scope-btn-outline'}">{$_('Einzelzimmer')}</button
						>
						<button
							type="button"
							on:click={() => switchBuchungsart('wohnung')}
							class="px-4 py-2 rounded text-sm font-medium transition-all {buchungsart === 'wohnung'
								? 'scope-btn-solid'
								: 'scope-btn-outline'}">{$_('Ganze Wohnung')}</button
						>
					</div>
				{/if}

				<!-- Infoleiste -->
				{#if ressource?.minNaechte > 1 || ressource?.preisProNacht}
					<div class="flex flex-wrap gap-6 text-base">
						{#if ressource?.preisProNacht}
							<span
								>{$_('Preis pro Nacht ab')}
								<strong
									>{new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
										preisProNachtAnzeige
									)}</strong
								></span
							>
						{/if}
						{#if ressource?.minNaechte > 1}
							<span
								>{$_('Mindestaufenthalt')}:
								<strong>{ressource.minNaechte} {$_('Nächte')}</strong></span
							>
						{/if}
					</div>
				{/if}

				<!-- Calendar -->
				<div class="scope-border scope-tint relative rounded border p-5">
					<RessourceKalender
						bookedRanges={calendarBookedRanges}
						allZimmerNamen={(ressource?.schlafzimmer ?? []).map((z) => z.zimmer_name || z.bett_typ)}
						bind:von
						bind:bis
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
									class="form-input form-input-lg"
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
									class="form-input form-input-lg"
								/>
							</div>
						</div>

						{#if priceError}
							<p class="text-sm text-red-600">{priceError}</p>
						{/if}

						<!-- Personen -->
						<div>
							<InputField
								field={{
									field_name: $_('Anzahl Personen'),
									field_type: 'Zahl',
									required: true,
									min: 1,
									max: ressource?.maxPersonen || null
								}}
								bind:value={personen}
							/>
							{#if ressource?.maxPersonen}
								<span class="text-muted text-xs"
									>{$_('Maximal')} {ressource.maxPersonen} {$_('Personen')}</span
								>
							{/if}
						</div>

						<!-- Zimmer-Auswahl (nur im Einzelzimmer-Modus) -->
						{#if showZimmerSelection}
							<fieldset class="flex flex-col gap-2">
								<legend class="block text-base font-bold mb-1">{$_('Zimmerauswahl')}</legend>
								{#each ressource?.schlafzimmer ?? [] as zimmer, i}
									{@const zimmerName = zimmer.zimmer_name || zimmer.bett_typ}
									{@const belegt = belegteZimmerNamen.has(zimmerName)}
									<label
										for="zimmer-{i}"
										class="flex items-center gap-3 text-sm {belegt
											? 'opacity-40 cursor-not-allowed'
											: 'cursor-pointer'}"
									>
										<Checkbox id="zimmer-{i}" bind:checked={zimmerSelected[i]} disabled={belegt} />
										<span class="flex-1" class:line-through={belegt}>{zimmerName}</span>
										<span class="text-muted">{zimmer.anzahl_betten}× {zimmer.bett_typ}</span>
										{#if belegt && (von || bis)}
											<span class="text-xs text-red-800">{$_('Belegt')}</span>
										{/if}
									</label>
								{/each}
								{#if zimmerError}
									<p class="text-sm mt-1 text-red-600">{zimmerError}</p>
								{/if}
							</fieldset>
						{/if}

						<!-- Weiter-Button -->
						<button
							type="button"
							on:click={goToStep2}
							disabled={!step1Valid}
							class="scope-btn-solid mt-2 px-6 py-3 font-medium transition-opacity"
						>
							{$_('Weiter')}
							<SvgIcons name="right" size="1em" />
						</button>
					</div>

					<!-- Right: Zimmer Akkordeon + Preisvorschau + Regeln -->
					<div class="flex flex-col gap-6">
						<!-- Price preview -->
						{#if von && bis && !priceError}
							<div class="scope-border scope-tint rounded border p-5">
								<p class="text-sm text-muted mb-3">{$_('Preisvorschau')}</p>
								<div class="flex justify-between text-sm mb-1">
									<span>{anzahlNaechte} {anzahlNaechte === 1 ? $_('Nacht') : $_('Nächte')}</span>
									<span>{preisFormatted}</span>
								</div>
								<div class="scope-border flex justify-between font-semibold border-t pt-2 mt-2">
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
										<details class="scope-border overflow-hidden rounded border">
											<summary
												class="flex items-center justify-between px-3 py-2 text-sm cursor-pointer list-none"
											>
												<span>{zimmerName}</span>
												<span class="flex items-center gap-2 text-muted shrink-0 ml-2">
													<span>{zimmer.anzahl_betten}× {zimmer.bett_typ}</span>
													<span class="text-xs">▾</span>
												</span>
											</summary>
											<div class="scope-border px-3 pb-3 pt-2 flex flex-col gap-2 border-t">
												{#if zimmer.bild?.url}
													<img
														src={zimmer.bild.url}
														alt={zimmer.bild.alt || zimmerName}
														class="w-full max-h-[200px] rounded object-cover"
													/>
												{/if}
												<p class="text-xs text-muted">{zimmer.anzahl_betten}× {zimmer.bett_typ}</p>
											</div>
										</details>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Rules -->
						<div class="text-sm text-muted flex flex-col gap-1">
							{#if (ressource?.minNaechte ?? 0) > 1}
								<p>{$_('Mindestaufenthalt')}: {ressource?.minNaechte} {$_('Nächte')}</p>
							{/if}
							{#if ressource?.preisProNacht}
								<p>
									{$_('Preis pro Nacht ab')}
									{new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
										preisProNachtAnzeige
									)}
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- ── STEP 2: Kontaktformular ── -->
			{:else}
				<!-- Buchungs-Zusammenfassung -->
				<div class="scope-border scope-tint rounded border p-5 flex flex-col gap-2">
					<p class="text-sm font-semibold mb-1">{$_('Ihre Auswahl')}</p>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
						<div>
							<p class="text-muted text-xs">{$_('Anreise')}</p>
							<p class="font-medium">{formatDate(von)}</p>
						</div>
						<div>
							<p class="text-muted text-xs">{$_('Abreise')}</p>
							<p class="font-medium">{formatDate(bis)}</p>
						</div>
						<div>
							<p class="text-muted text-xs">{$_('Nächte')}</p>
							<p class="font-medium">{anzahlNaechte}</p>
						</div>
						<div>
							<p class="text-muted text-xs">{$_('Personen')}</p>
							<p class="font-medium">{personen}</p>
						</div>
					</div>
					{#if showZimmerSelection && selectedZimmer.length > 0}
						<p class="text-xs text-muted mt-1">
							{$_('Zimmer')}: {selectedZimmer.map((z) => z.zimmer_name || z.bett_typ).join(', ')}
						</p>
					{/if}
					{#if totalPreis > 0}
						<p class="text-sm font-semibold mt-1">{$_('Total')}: {preisFormatted}</p>
					{/if}
					<button
						type="button"
						on:click={backToStep1}
						class="text-xs underline text-muted hover:opacity-100 text-left mt-1 w-fit"
					>
						<SvgIcons name="left" size="1em" />
						{$_('Auswahl ändern')}
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
							class="form-input form-input-lg"
						/>
					</div>

					<div>
						<label for="email" class="block text-base font-bold">{$_('E-Mail')} *</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							class="form-input form-input-lg"
						/>
					</div>

					<InputField
						field={{ field_name: $_('Telefon'), field_type: 'Telefon', required: true }}
						bind:value={telefon}
					/>

					<div>
						<label for="referenz-email" class="block text-base font-bold"
							>{$_('Freundes-Referenz-E-Mail Adresse')}</label
						>
						<input
							id="referenz-email"
							type="email"
							bind:value={referenzEmail}
							class="form-input form-input-lg"
						/>
						{#if referenzEmailChecking}
							<p class="text-xs text-muted -mt-3">{$_('Wird geprüft…')}</p>
						{:else if referenzEmail && referenzEmail.includes('@')}
							{#if referenzEmailFound === true}
								<p class="text-xs -mt-3 text-green-700">✓ {$_('E-Mail gefunden')}</p>
							{:else if referenzEmailFound === false}
								<p class="text-xs -mt-3 text-red-600">✗ {$_('E-Mail nicht gefunden')}</p>
							{/if}
						{/if}
					</div>

					<div>
						<label for="nachricht" class="block text-base font-bold">{$_('Nachricht')}</label>
						<div class="border-page border-b focus-within:border-b-2">
							<textarea
								id="nachricht"
								bind:value={nachricht}
								rows="4"
								class="mt-1 p-2 block w-full rounded-md focus:outline-none focus:ring-0 resize-none bg-page-bg text-page form-input-lg"
							></textarea>
						</div>
					</div>

					{#if errorMsg}
						<p class="text-sm text-red-600">{errorMsg}</p>
					{/if}

					<div class="flex gap-3 flex-wrap pt-2">
						<button
							type="button"
							on:click={backToStep1}
							class="scope-btn-outline px-6 py-3 font-medium transition-opacity"
						>
							<SvgIcons name="left" size="1em" />
							{$_('Zurück')}
						</button>
						<button
							type="submit"
							disabled={!formValid || loading}
							class="scope-btn-solid px-6 py-3 font-medium transition-opacity"
						>
							{loading ? $_('Wird gesendet…') : slice.primary.submit_label || $_('Jetzt anfragen')}
						</button>
					</div>
				</form>
			{/if}
		{:else}
			<p class="text-muted text-sm">{$_('Keine Ressource verknüpft')}</p>
		{/if}
	</div>
</Bounded>
