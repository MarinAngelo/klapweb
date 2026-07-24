<script lang="ts">
import { PrismicRichText } from '@prismicio/svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
import { useOpenIndex } from '$lib/utils/useOpenIndex';
import { _ } from '$lib/stores/i18n';

	export let slice: any;
	export const index: number = 0;

	const inputStyle = `background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);`;
	const inputClass = 'mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm';

	// ── Auth state ────────────────────────────────────────────────────────────
	let buchungId = '';
	let email = '';
	let loggedIn = false;
	let loginError = '';
	let loginLoading = false;

	// ── Aufgaben state ────────────────────────────────────────────────────────
	type Annahme = {
		id: string;
		aufgabeUid: string;
		aufgabeTitel: string;
		status: string;
		creditTyp: 'fest' | 'offen';
		creditBetrag?: number;
		preisProNacht?: number;
		credits?: number;
		minuten?: number;
		angenommenAt: string;
		erledigtAt?: string;
	};

	// Available aufgaben come from CMS (Prismic) via a fetch
	type Werkzeug = {
		uid: string | null;
		titel: string;
		beschreibung: any;
		bild: { url: string; alt: string } | null;
	};

	type Aufgabe = {
		uid: string;
		titel: string;
		beschreibung: any;
		bild: { url: string; alt: string } | null;
		aktiv: boolean;
		max_annahmen: number;
		credit_typ: string;
		credit_betrag: number | null;
		werkzeuge: Werkzeug[];
	};

	let aufgaben: Aufgabe[] = [];
	let annahmen: Annahme[] = [];
	let aufgabenLoading = false;

	// ── Per-task action state ─────────────────────────────────────────────────
	let actionLoading: Record<string, boolean> = {};
	let actionError: Record<string, string> = {};
	let minutenInput: Record<string, string> = {};
	let kommentarInput: Record<string, string> = {};
	let attachmentFiles: Record<string, FileList | undefined> = {};
	let abgabeVisible: Record<string, boolean> = {};

	// ── Login ─────────────────────────────────────────────────────────────────
	async function handleLogin() {
		loginError = '';
		loginLoading = true;
		try {
			const res = await fetch(`/api/aufgaben?buchungId=${encodeURIComponent(buchungId)}&email=${encodeURIComponent(email)}`);
			if (res.status === 404 || res.status === 403 || res.status === 400) {
				const data = await res.json().catch(() => ({}));
				loginError = data.error || $_('Ungültige Kombination von Buchungs-ID und E-Mail');
				return;
			}
			if (!res.ok) {
				loginError = $_('Ein Fehler ist aufgetreten');
				return;
			}
			annahmen = await res.json();
			await loadAufgaben();
			loggedIn = true;
		} catch {
			loginError = $_('Ein Fehler ist aufgetreten');
		} finally {
			loginLoading = false;
		}
	}

	async function loadAufgaben() {
		aufgabenLoading = true;
		try {
			const res = await fetch(`/api/aufgaben-liste`);
			if (res.ok) aufgaben = await res.json();
		} catch {
			// non-critical
		} finally {
			aufgabenLoading = false;
		}
	}

	async function annahmeAktualisieren() {
		try {
			const res = await fetch(`/api/aufgaben?buchungId=${encodeURIComponent(buchungId)}&email=${encodeURIComponent(email)}`);
			if (res.ok) annahmen = await res.json();
		} catch { /* non-critical */ }
	}

	// ── Annehmen ──────────────────────────────────────────────────────────────
	async function aufgabeAnnehmen(aufgabe: Aufgabe) {
		actionError[aufgabe.uid] = '';
		actionLoading[aufgabe.uid] = true;
		try {
			const res = await fetch('/api/aufgabe-annehmen', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					buchungId,
					email,
					name: email,
					aufgabeUid: aufgabe.uid,
					aufgabeTitel: aufgabe.titel,
					creditTyp: aufgabe.credit_typ === 'Offen (Zeitbasiert)' ? 'offen' : 'fest',
					creditBetrag: aufgabe.credit_betrag ?? undefined
				})
			});
			const data = await res.json();
			if (!res.ok) {
				actionError[aufgabe.uid] = data.error || $_('Aufgabe konnte nicht angenommen werden');
				return;
			}
			await annahmeAktualisieren();
		} catch {
			actionError[aufgabe.uid] = $_('Aufgabe konnte nicht angenommen werden');
		} finally {
			actionLoading[aufgabe.uid] = false;
		}
	}

	// ── Abgeben ───────────────────────────────────────────────────────────────
	async function aufgabeAbgeben(annahme: Annahme) {
		const aid = annahme.id;
		actionError[aid] = '';
		actionLoading[aid] = true;
		try {
			const fd = new FormData();
			fd.append('annahmeId', aid);
			fd.append('email', email);
			if (minutenInput[aid]) fd.append('minuten', minutenInput[aid]);
			const kommentar = kommentarInput[aid]?.trim();
			if (kommentar) fd.append('kommentar', kommentar);
			const file = attachmentFiles[aid]?.[0];
			if (file) fd.append('attachment', file);
			const res = await fetch('/api/aufgabe-abgeben', { method: 'POST', body: fd });
			const data = await res.json();
			if (!res.ok) {
				actionError[aid] = data.error || $_('Abgabe fehlgeschlagen');
				return;
			}
			abgabeVisible[aid] = false;
			await annahmeAktualisieren();
		} catch {
			actionError[aid] = $_('Abgabe fehlgeschlagen');
		} finally {
			actionLoading[aid] = false;
		}
	}


	function logout() {
		loggedIn = false;
		buchungId = '';
		email = '';
		annahmen = [];
		aufgaben = [];
	}

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		erledigt: 'Erledigt'
	};

	const haftungsausschlussUrl = '/haftungsausschluss';
	let haftungAccepted = false;

	const { openIndex: aufgabenOpenIndex, toggleItem: toggleAufgabe } = useOpenIndex(0);
	const { openIndex: meineOpenIndex, toggleItem: toggleMeine } = useOpenIndex(null);

	$: angenommeneUids = new Set(annahmen.map((a) => a.aufgabeUid));
	$: verfuegbareAufgaben = aufgaben.filter((a) => a.aktiv && !angenommeneUids.has(a.uid));
	$: meineAufgaben = annahmen;
	$: aufgabenMap = new Map(aufgaben.map((a) => [a.uid, a]));

	$: primary = slice.primary as any;
	$: bgColor = primary?.bg_color || '';
	$: textColor = primary?.text_color || '';
</script>

<Bounded {slice}>
	<div
		style={[bgColor ? `background-color:${bgColor};` : '', textColor ? `color:${textColor};` : ''].join('')}
	>
		{#if loggedIn}
			{#if primary.heading}
				<div class="mb-4"><PrismicRichText field={primary.heading} /></div>
			{/if}
			{#if primary.intro}
				<div class="mb-8 prose"><PrismicRichText field={primary.intro} /></div>
			{/if}
		{/if}

		{#if !loggedIn}
			<!-- Seiten-Inhalt (ausgegraut) -->
			<div class="opacity-30 pointer-events-none select-none flex flex-col gap-6">
				<div class="h-8 rounded w-48 bg-current opacity-20"></div>
				<div class="flex flex-col gap-3">
					{#each [1,2,3] as _}
						<div class="h-14 rounded border-b border-current opacity-10"></div>
					{/each}
				</div>
			</div>

			<!-- Login Modal -->
			<div
				class="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
				style="background-color: rgba(0,0,0,0.45);"
			>
				<div
					class="w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5"
					style="background-color: var(--page-bg-color); color: var(--page-color);"
				>
					<h2 class="text-2xl font-bold">{$_('Aufgabenliste')}</h2>
					<p class="text-base">{$_('Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.')}</p>
					<form on:submit|preventDefault={handleLogin} class="flex flex-col gap-4">
						<div>
							<label for="aufgaben-buchung-id" class="block text-sm font-medium">{$_('Buchungs-ID')}</label>
							<input
								id="aufgaben-buchung-id"
								type="text"
								bind:value={buchungId}
								required
								class={inputClass}
								style={inputStyle}
							/>
						</div>
						<div>
							<label for="aufgaben-email" class="block text-sm font-medium">{$_('E-Mail')}</label>
							<input
								id="aufgaben-email"
								type="email"
								bind:value={email}
								required
								class={inputClass}
								style={inputStyle}
							/>
						</div>
						{#if loginError}
							<p class="text-sm text-red-600">{loginError}</p>
						{/if}
						<button
							type="submit"
							disabled={loginLoading}
							class="mt-2 px-6 py-2 text-sm font-medium rounded"
							style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {loginLoading ? 0.6 : 1};"
						>
							{loginLoading ? $_('Wird geladen…') : $_('Einloggen')}
						</button>
					</form>
				</div>
			</div>
		{:else}
			<!-- Eingeloggt -->
			<div class="flex items-center justify-between mb-6">
				<p class="text-sm opacity-60">{$_('E-Mail')}: {email}</p>
				<button on:click={logout} class="text-sm underline opacity-60">{$_('Abmelden')}</button>
			</div>

			<!-- Meine Aufgaben -->
			{#if meineAufgaben.length > 0}
				<h3 class="text-lg font-semibold mb-3">{$_('Meine Aufgaben')}</h3>
				<div class="flex flex-col gap-4 mb-8">
					{#each meineAufgaben as a, i (a.id)}
						{@const aufgabe = aufgabenMap.get(a.aufgabeUid)}
						<div class="border-b pb-0 md:pb-4 md:rounded-t min-w-0 px-3"
							style="border-color: var(--page-color); background-color: var(--page-color-11, color-mix(in srgb, var(--page-color) 7%, transparent));"
						>
							<button
								class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3 py-1 pb-5 md:pb-1 text-left"
								aria-expanded={$meineOpenIndex === i}
								on:click={() => toggleMeine(i)}
							>
								<span class="flex flex-col gap-0.5 min-w-0">
									<span>{a.aufgabeTitel}</span>
									<span class="text-sm font-normal opacity-60">
										{statusLabels[a.status] ?? a.status}{#if a.credits != null} · {a.credits} {$_('Credits')}{/if}{#if a.minuten != null} · {a.minuten} min{/if}
									</span>
								</span>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
									class="w-6 h-6 ml-1 fill-current transform transition-transform shrink-0"
									class:rotate-180={$meineOpenIndex === i}>
									<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
								</svg>
							</button>

							<div class="accordion-body" style="grid-template-rows: {$meineOpenIndex === i ? '1fr' : '0fr'};">
								<div class="overflow-hidden">
									<div class="pb-4 pt-2 flex flex-col gap-8">
										<!-- Aufgaben-Infos (gleich wie verfügbare Aufgaben) -->
										{#if aufgabe}
											<div class="grid grid-cols-1 gap-8 {aufgabe.bild?.url ? 'md:grid-cols-2' : ''}">
												<div class="flex flex-col">
													{#if aufgabe.beschreibung}
														<div class="prose"><PrismicRichText field={aufgabe.beschreibung} /></div>
													{/if}
												</div>
												{#if aufgabe.bild?.url}
													<div class="md:rounded-3xl overflow-hidden">
														<img src={aufgabe.bild.url} alt={aufgabe.bild.alt || aufgabe.titel} class="w-full h-full object-cover" />
													</div>
												{/if}
											</div>
											{#if aufgabe.werkzeuge?.length > 0}
												<div class="flex flex-col gap-6">
													<p class="text-xs font-medium uppercase opacity-50">{$_('Benötigte Werkzeuge')}</p>
													{#each aufgabe.werkzeuge as w}
														<div class="grid grid-cols-1 gap-8 {w.bild?.url ? 'md:grid-cols-2' : ''}">
															<div class="flex flex-col gap-1">
																<p class="font-medium">{w.titel}</p>
																{#if w.beschreibung}
																	<div class="prose text-sm opacity-80"><PrismicRichText field={w.beschreibung} /></div>
																{/if}
															</div>
															{#if w.bild?.url}
																<div class="md:rounded-3xl overflow-hidden">
																	<img src={w.bild.url} alt={w.bild.alt || w.titel} class="w-full h-full object-cover" />
																</div>
															{/if}
														</div>
													{/each}
												</div>
											{/if}
										{/if}

										<!-- Abgabe-Formular -->
										{#if !['erledigt', 'eingereicht'].includes(a.status)}
											<div class="flex flex-col gap-3">
												<p class="text-sm font-medium">{$_('Aufgabe abgeben')}</p>
												{#if a.creditTyp === 'offen'}
													<label for="minuten-{a.id}" class="block text-sm">{$_('Geleistete Minuten')}</label>
													<input id="minuten-{a.id}" type="number" min="1" bind:value={minutenInput[a.id]} class={inputClass} style={inputStyle} placeholder={$_('Minuten eingeben')} />
												{/if}
												<label for="kommentar-{a.id}" class="block text-sm">{$_('Kommentar (optional)')}</label>
												<textarea id="kommentar-{a.id}" bind:value={kommentarInput[a.id]} rows="3" class={inputClass} style={inputStyle} placeholder={$_('Kommentar eingeben')}></textarea>
												<label for="attachment-{a.id}" class="block text-sm">{$_('Anhang (optional)')}</label>
												<input id="attachment-{a.id}" type="file" bind:files={attachmentFiles[a.id]} class="text-sm" />
												{#if actionError[a.id]}
													<p class="text-sm text-red-600">{actionError[a.id]}</p>
												{/if}
												<button type="button" disabled={actionLoading[a.id]} on:click={() => aufgabeAbgeben(a)}
													class="px-4 py-1.5 text-sm rounded self-start"
													style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {actionLoading[a.id] ? 0.6 : 1};">
													{actionLoading[a.id] ? $_('Wird geladen…') : $_('Aufgabe abgeben')}
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Verfügbare Aufgaben -->
			<h3 class="text-lg font-semibold mb-3">{$_('Verfügbare Aufgaben')}</h3>
			{#if aufgabenLoading}
				<p class="text-sm opacity-60">{$_('Wird geladen…')}</p>
			{:else if verfuegbareAufgaben.length === 0}
				<p class="text-sm opacity-60">{$_('Keine Aufgaben verfügbar')}</p>
			{:else}
				<div class="flex flex-col gap-4">
					{#each verfuegbareAufgaben as aufgabe, i (aufgabe.uid)}
						<div class="border-b pb-0 md:pb-4 md:rounded-t min-w-0 px-3"
							style="border-color: var(--page-color); background-color: var(--page-color-11, color-mix(in srgb, var(--page-color) 7%, transparent));"
						>
							<button
								class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3 py-1 pb-5 md:pb-1 text-left"
								aria-expanded={$aufgabenOpenIndex === i}
								on:click={() => toggleAufgabe(i)}
							>
								{aufgabe.titel}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									class="w-6 h-6 ml-1 fill-current transform transition-transform shrink-0"
									class:rotate-180={$aufgabenOpenIndex === i}
								>
									<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
								</svg>
							</button>

							<div class="accordion-body" style="grid-template-rows: {$aufgabenOpenIndex === i ? '1fr' : '0fr'};">
								<div class="overflow-hidden">
									<div class="pb-4 pt-2 flex flex-col gap-8">
										<!-- Zeile 1: Beschreibung + Aufgaben-Bild -->
										<div class="grid grid-cols-1 gap-8 {aufgabe.bild?.url ? 'md:grid-cols-2' : ''}">
											<div class="flex flex-col">
												{#if aufgabe.beschreibung}
													<div class="prose">
														<PrismicRichText field={aufgabe.beschreibung} />
													</div>
												{/if}
											</div>
											{#if aufgabe.bild?.url}
												<div class="md:rounded-3xl overflow-hidden">
													<img
														src={aufgabe.bild.url}
														alt={aufgabe.bild.alt || aufgabe.titel}
														class="w-full h-full object-cover"
													/>
												</div>
											{/if}
										</div>

										<!-- Zeile 2: Werkzeuge (je ein Grid-Row pro Werkzeug) -->
										{#if aufgabe.werkzeuge?.length > 0}
											<div class="flex flex-col gap-6">
												<p class="text-xs font-medium uppercase opacity-50">{$_('Benötigte Werkzeuge')}</p>
												{#each aufgabe.werkzeuge as w}
													<div class="grid grid-cols-1 gap-8 {w.bild?.url ? 'md:grid-cols-2' : ''}">
														<div class="flex flex-col gap-1">
															<p class="font-medium">{w.titel}</p>
															{#if w.beschreibung}
																<div class="prose text-sm opacity-80">
																	<PrismicRichText field={w.beschreibung} />
																</div>
															{/if}
														</div>
														{#if w.bild?.url}
															<div class="md:rounded-3xl overflow-hidden">
																<img
																	src={w.bild.url}
																	alt={w.bild.alt || w.titel}
																	class="w-full h-full object-cover"
																/>
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/if}

										<!-- Credits + Haftung + Button -->
										<div class="flex flex-col gap-3">
											<p class="text-sm opacity-60">
												{aufgabe.credit_typ === 'Offen (Zeitbasiert)' ? $_('Zeitbasiert') : $_('Fest')}
												{#if aufgabe.credit_typ !== 'Offen (Zeitbasiert)' && aufgabe.credit_betrag != null}
													· {aufgabe.credit_betrag} Credits
												{/if}
											</p>
											{#if actionError[aufgabe.uid]}
												<p class="text-sm text-red-600">{actionError[aufgabe.uid]}</p>
											{/if}
											<label for="haftung-{aufgabe.uid}" class="flex items-start gap-2 cursor-pointer text-sm">
												<Checkbox id="haftung-{aufgabe.uid}" bind:checked={haftungAccepted} />
												<span>
													{$_('Ich habe den')}
													<a href={haftungsausschlussUrl} target="_blank" class="underline">{$_('Haftungsausschluss')}</a>
													{$_('gelesen und akzeptiere diesen.')}
												</span>
											</label>
											<button
												type="button"
												disabled={actionLoading[aufgabe.uid] || !haftungAccepted}
												on:click={() => aufgabeAnnehmen(aufgabe)}
												class="px-4 py-1.5 text-sm rounded self-start"
												style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {actionLoading[aufgabe.uid] || !haftungAccepted ? 0.4 : 1};"
											>
												{actionLoading[aufgabe.uid] ? $_('Wird geladen…') : $_('Aufgabe annehmen')}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</Bounded>

<style>
	.accordion-body {
		display: grid;
		transition: grid-template-rows 300ms ease-out;
	}
</style>
