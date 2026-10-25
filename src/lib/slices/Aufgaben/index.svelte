<script lang="ts">
	import { PrismicRichText } from '@prismicio/svelte';
	import RichTextEmbed from '$lib/components/PrismicRichText/Embed.svelte';
	import Bounded from '$lib/components/Bounded.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import AufgabeDetails from './AufgabeDetails.svelte';
	import AufgabeAnnehmen from './AufgabeAnnehmen.svelte';
	import FileField from '$lib/components/FileField.svelte';
	import { useOpenIndex } from '$lib/utils/useOpenIndex';
	import { _ } from '$lib/stores/i18n';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let slice: any;
	export const index: number = 0;

	const inputStyle = `background-color: var(--page-bg-color); color: var(--page-color); border-bottom-color: var(--page-color);`;
	const inputClass =
		'input mt-1 p-2 block w-full rounded-none border-b focus:border-b-2 focus:outline-none focus:ring-0 sm:text-sm';

	// ── Auth state ────────────────────────────────────────────────────────────
	let buchungId = '';
	let loggedIn = false;
	let loginError = '';
	let loginLoading = false;
	let rememberMe = false;
	let restoring = false; // auto-login from remembered reference in progress

	// "Remember me": booking reference in localStorage, registered as functional
	// consent service "aufgaben_login"
	const REMEMBER_KEY = 'klap_aufgaben_login';
	const REMEMBER_MS = 14 * 24 * 60 * 60 * 1000;

	function saveRemembered() {
		try {
			localStorage.setItem(
				REMEMBER_KEY,
				JSON.stringify({ buchungId, expires: Date.now() + REMEMBER_MS })
			);
		} catch {
			/* storage unavailable */
		}
	}

	function clearRemembered() {
		try {
			localStorage.removeItem(REMEMBER_KEY);
		} catch {
			/* storage unavailable */
		}
	}

	function readRemembered(): string | null {
		try {
			const raw = localStorage.getItem(REMEMBER_KEY);
			if (!raw) return null;
			const data = JSON.parse(raw);
			if (typeof data?.buchungId === 'string' && data.expires > Date.now()) return data.buchungId;
		} catch {
			/* invalid or unavailable */
		}
		clearRemembered();
		return null;
	}

	onMount(() => {
		const remembered = readRemembered();
		if (remembered) {
			buchungId = remembered;
			rememberMe = true;
			restoring = true;
			handleLogin().finally(() => (restoring = false));
		}
	});

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
		fotoVorher?: string;
		fotoNachher?: string;
		hauptaufgabeUid?: string;
		hauptaufgabeTitel?: string;
		bonus?: boolean;
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
		parent_uid: string | null;
		position: number;
		enforce_order: boolean;
		bonus_credits: number | null;
		erledigt: boolean; // completed at least once (any booking)
		vergeben: boolean; // max. acceptances reached
		gesperrt_durch: string[]; // titles of previous subtasks still open (enforced order)
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

	// ── Vorher/Nachher Fotos ────────────────────────────────────────────────
	// Key: `${annahmeId}:${art}` — Preview-URL (sofort sichtbar) oder Server-URL
	let fotoPreview: Record<string, string> = {};
	let fotoUploading: Record<string, boolean> = {};
	let fotoError: Record<string, string> = {};

	async function fotoHochladen(a: Annahme, art: 'vorher' | 'nachher', file: File | undefined) {
		if (!file) return;
		const key = `${a.id}:${art}`;
		fotoError[key] = '';
		fotoPreview[key] = URL.createObjectURL(file); // sofort anzeigen
		fotoUploading[key] = true;
		try {
			const fd = new FormData();
			fd.append('annahmeId', a.id);
			fd.append('art', art);
			fd.append('file', file);
			const res = await fetch('/api/aufgabe-foto', { method: 'POST', body: fd });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				delete fotoPreview[key];
				fotoError[key] = data.error || $_('Foto konnte nicht hochgeladen werden');
				return;
			}
			fotoPreview[key] = data.url; // Server-URL übernimmt
			a[art === 'vorher' ? 'fotoVorher' : 'fotoNachher'] = data.url;
		} catch {
			delete fotoPreview[key];
			fotoError[key] = $_('Foto konnte nicht hochgeladen werden');
		} finally {
			fotoUploading[key] = false;
		}
	}

	function handleFotoChange(a: Annahme, art: string, e: Event) {
		fotoHochladen(a, art as 'vorher' | 'nachher', (e.currentTarget as HTMLInputElement).files?.[0]);
	}

	// ── Login ─────────────────────────────────────────────────────────────────
	async function handleLogin() {
		loginError = '';
		loginLoading = true;
		try {
			const res = await fetch(`/api/aufgaben?buchungId=${encodeURIComponent(buchungId)}`);
			if (res.status === 404 || res.status === 403 || res.status === 400) {
				const data = await res.json().catch(() => ({}));
				loginError = data.error || $_('Ungültige Kombination von Buchungs-ID und E-Mail');
				clearRemembered();
				return;
			}
			if (!res.ok) {
				loginError = $_('Ein Fehler ist aufgetreten');
				return;
			}
			annahmen = await res.json();
			await loadAufgaben();
			loggedIn = true;
			if (rememberMe) saveRemembered();
			else clearRemembered();
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
			const res = await fetch(`/api/aufgaben?buchungId=${encodeURIComponent(buchungId)}`);
			if (res.ok) annahmen = await res.json();
		} catch {
			/* non-critical */
		}
	}

	// ── Annehmen ──────────────────────────────────────────────────────────────
	async function aufgabeAnnehmen(aufgabe: Aufgabe) {
		actionError[aufgabe.uid] = '';
		actionLoading[aufgabe.uid] = true;
		try {
			const res = await fetch('/api/aufgabe-annehmen', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ buchungId, aufgabeUid: aufgabe.uid })
			});
			const data = await res.json();
			if (!res.ok) {
				actionError[aufgabe.uid] = data.error
					? $_(data.error)
					: $_('Aufgabe konnte nicht angenommen werden');
				// counters may be outdated (e.g. task taken by someone else meanwhile)
				await loadAufgaben();
				return;
			}
			await Promise.all([annahmeAktualisieren(), loadAufgaben()]);
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

	// Leave the page: back if there is history, otherwise to the start page
	function cancelLogin() {
		if (history.length > 1) history.back();
		else goto('/');
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if (!loggedIn && e.key === 'Escape') cancelLogin();
	}

	// Leave to the start page; state is not reset first so the login modal doesn't flash
	function logout() {
		clearRemembered();
		goto('/');
	}

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		abgegeben: 'Abgegeben',
		erledigt: 'Erledigt'
	};

	const haftungsausschlussUrl = '/haftungsausschluss';
	let haftungAccepted = false;

	const { openIndex: aufgabenOpenIndex, toggleItem: toggleAufgabe } = useOpenIndex(0);
	const { openIndex: meineOpenIndex, toggleItem: toggleMeine } = useOpenIndex(null);

	$: verfuegbareAufgaben = aufgaben.filter((a) => a.aktiv && !a.parent_uid);
	$: meineAufgaben = annahmen;
	$: aufgabenMap = new Map(aufgaben.map((a) => [a.uid, a]));
	// Subtasks per main task, sorted by position (API sends them flat)
	$: teilaufgabenMap = aufgaben
		.filter((a) => a.parent_uid)
		.sort((a, b) => a.position - b.position || a.titel.localeCompare(b.titel))
		.reduce((map, a) => {
			map.set(a.parent_uid!, [...(map.get(a.parent_uid!) ?? []), a]);
			return map;
		}, new Map<string, Aufgabe[]>());
	// Tasks this booking has accepted but not completed yet
	$: eigeneOffen = new Set(
		annahmen.filter((a) => a.status !== 'erledigt' && !a.bonus).map((a) => a.aufgabeUid)
	);
	$: eigeneErledigt = new Set(
		annahmen.filter((a) => a.status === 'erledigt' && !a.bonus).map((a) => a.aufgabeUid)
	);

	const annahmeTitel = (a: Annahme) =>
		a.hauptaufgabeTitel ? `${a.hauptaufgabeTitel} › ${a.aufgabeTitel}` : a.aufgabeTitel;

	$: fortschritt = (teile: Aufgabe[]) =>
		$_('{erledigt} von {total} Teilaufgaben erledigt')
			.replace('{erledigt}', String(teile.filter((t) => t.erledigt).length))
			.replace('{total}', String(teile.length));

	$: eigenerFortschritt = (teile: Aufgabe[]) =>
		$_('Du: {erledigt} von {total}')
			.replace('{erledigt}', String(teile.filter((t) => eigeneErledigt.has(t.uid)).length))
			.replace('{total}', String(teile.length));

	$: primary = slice.primary as any;
	$: bgColor = primary?.bg_color || '';
	$: textColor = primary?.text_color || '';
</script>

<svelte:window on:keydown={handleModalKeydown} />

<Bounded {slice}>
	<div
		style={[
			bgColor ? `background-color:${bgColor};` : '',
			textColor ? `color:${textColor};` : ''
		].join('')}
	>
		{#if loggedIn}
			{#if primary.heading}
				<div class="mb-4">
					<PrismicRichText field={primary.heading} components={{ embed: RichTextEmbed }} />
				</div>
			{/if}
			{#if primary.intro}
				<div class="mb-8 prose">
					<PrismicRichText field={primary.intro} components={{ embed: RichTextEmbed }} />
				</div>
			{/if}
		{/if}

		{#if !loggedIn}
			<!-- Seiten-Inhalt (ausgegraut) -->
			<div class="opacity-30 pointer-events-none select-none flex flex-col gap-6">
				<div class="h-8 rounded w-48 bg-current opacity-20"></div>
				<div class="flex flex-col gap-3">
					{#each [1, 2, 3] as _}
						<div class="h-14 rounded border-b border-current opacity-10"></div>
					{/each}
				</div>
			</div>

			<!-- Login Modal -->
			{#if !restoring}
				<div
					class="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
					style="background-color: rgba(0,0,0,0.45);"
				>
					<div
						class="w-full max-w-sm rounded-2xl shadow-2xl p-8 flex flex-col gap-5"
						style="background-color: var(--page-bg-color); color: var(--page-color);"
					>
						<h2 class="text-2xl font-bold">{$_('Aufgabenliste')}</h2>
						<p class="text-base">
							{$_('Bitte melde dich mit der Buchungs-ID an, die du per E-Mail erhalten hast.')}
						</p>
						<form on:submit|preventDefault={handleLogin} class="flex flex-col gap-4">
							<div>
								<label for="aufgaben-buchung-id">{$_('Buchungs-Referenz')}</label>
								<input
									id="aufgaben-buchung-id"
									type="text"
									bind:value={buchungId}
									required
									class={inputClass}
									style={inputStyle}
								/>
							</div>
							<label for="aufgaben-remember" class="flex items-start gap-2 cursor-pointer text-sm">
								<Checkbox id="aufgaben-remember" bind:checked={rememberMe} />
								<span>{$_('Angemeldet bleiben (14 Tage)')}</span>
							</label>
							{#if loginError}
								<p class="text-sm text-red-600">{loginError}</p>
							{/if}
							<button
								type="submit"
								disabled={loginLoading}
								class="mt-2 px-6 py-2 text-sm font-medium rounded"
								style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {loginLoading
									? 0.6
									: 1};"
							>
								{loginLoading ? $_('Wird geladen…') : $_('Einloggen')}
							</button>
							<button type="button" on:click={cancelLogin} class="text-sm underline opacity-60">
								{$_('Abbrechen')}
							</button>
						</form>
					</div>
				</div>
			{/if}
		{:else}
			<!-- Eingeloggt -->
			<div class="flex items-center justify-between mb-6">
				<p class="text-sm opacity-60">{$_('Buchungs-Referenz')}: {buchungId}</p>
				<button on:click={logout} class="text-sm underline opacity-60">{$_('Abmelden')}</button>
			</div>

			<!-- Meine Aufgaben -->
			{#if meineAufgaben.length > 0}
				<h3 class="text-lg font-semibold mb-3">{$_('Meine Aufgaben')}</h3>
				<div class="flex flex-col gap-4 mb-8">
					{#each meineAufgaben as a, i (a.id)}
						{@const aufgabe = aufgabenMap.get(a.aufgabeUid)}
						<div
							class="border-b pb-0 md:pb-4 md:rounded-t min-w-0 px-3"
							style="border-color: var(--page-color); background-color: var(--page-color-11, color-mix(in srgb, var(--page-color) 7%, transparent));"
						>
							<button
								class="text-2xl font-semibold tracking-tight inline-flex items-center justify-between w-full mt-3 py-1 pb-5 md:pb-1 text-left"
								aria-expanded={$meineOpenIndex === i}
								on:click={() => toggleMeine(i)}
							>
								<span class="flex flex-col gap-0.5 min-w-0">
									<span>{annahmeTitel(a)}</span>
									<span class="text-sm font-normal opacity-60">
										{statusLabels[a.status] ?? a.status}{#if a.credits != null}
											· {a.credits} {$_('Credits')}{/if}{#if a.minuten != null}
											· {a.minuten} min{/if}
									</span>
								</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									class="w-6 h-6 ml-1 fill-current transform transition-transform shrink-0"
									class:rotate-180={$meineOpenIndex === i}
								>
									<path
										d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
									/>
								</svg>
							</button>

							<div
								class="accordion-body"
								style="grid-template-rows: {$meineOpenIndex === i ? '1fr' : '0fr'};"
							>
								<div class="overflow-hidden">
									<div class="pb-4 pt-2 flex flex-col gap-8">
										<!-- Aufgaben-Infos (gleich wie verfügbare Aufgaben) -->
										{#if aufgabe}
											<AufgabeDetails {aufgabe} />
										{/if}
										<!-- Vorher/Nachher-Fotos -->
										{#if !a.bonus}
											<div class="flex flex-col gap-3">
												<p class="text-sm font-medium">{$_('Fotos')}</p>
												<div class="grid grid-cols-2 gap-3">
													{#each ['vorher', 'nachher'] as art}
														{@const key = `${a.id}:${art}`}
														{@const url =
															fotoPreview[key] || (art === 'vorher' ? a.fotoVorher : a.fotoNachher)}
														<div class="flex flex-col gap-1">
															<label
																for="foto-{key}"
																class="block border rounded-lg overflow-hidden cursor-pointer relative"
																style="border-color: var(--page-color); aspect-ratio: 4/3; background-color: color-mix(in srgb, var(--page-color) 6%, transparent);"
															>
																{#if url}
																	<img
																		src={url}
																		alt={art === 'vorher' ? $_('Vorher') : $_('Nachher')}
																		class="w-full h-full object-cover"
																	/>
																{:else}
																	<span
																		class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs opacity-60"
																	>
																		<span class="text-xl">📷</span>
																		{art === 'vorher' ? $_('Vorher') : $_('Nachher')}
																	</span>
																{/if}
																{#if fotoUploading[key]}
																	<span
																		class="absolute inset-0 flex items-center justify-center text-xs"
																		style="background-color: color-mix(in srgb, var(--page-bg-color) 70%, transparent);"
																		>{$_('Wird hochgeladen…')}</span
																	>
																{/if}
															</label>
															<input
																id="foto-{key}"
																type="file"
																accept="image/*"
																class="sr-only"
																disabled={fotoUploading[key] ||
																	['erledigt', 'eingereicht'].includes(a.status)}
																on:change={(e) => handleFotoChange(a, art, e)}
															/>
															{#if fotoError[key]}
																<p class="text-xs text-red-600">{fotoError[key]}</p>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}
										<!-- Abgabe-Formular -->
										{#if !['erledigt', 'abgegeben'].includes(a.status)}
											<div class="flex flex-col gap-3">
												<p class="text-sm font-medium">{$_('Aufgabe abgeben')}</p>
												{#if a.creditTyp === 'offen'}
													<label for="minuten-{a.id}" class="block text-sm"
														>{$_('Geleistete Minuten')}</label
													>
													<input
														id="minuten-{a.id}"
														type="number"
														min="1"
														bind:value={minutenInput[a.id]}
														class={inputClass}
														style={inputStyle}
														placeholder={$_('Minuten eingeben')}
													/>
												{/if}
												<label for="kommentar-{a.id}" class="block text-sm"
													>{$_('Kommentar oder Beschreibung der Aufgabe')} *</label
												>
												<textarea
													id="kommentar-{a.id}"
													bind:value={kommentarInput[a.id]}
													rows="3"
													required
													class={inputClass}
													style={inputStyle}
													placeholder={$_('Kommentar eingeben')}
												></textarea>
												<FileField
													id="attachment-{a.id}"
													label={$_('Anhang (optional)')}
													bind:files={attachmentFiles[a.id]}
												/>
												{#if actionError[a.id]}
													<p class="text-sm text-red-600">{actionError[a.id]}</p>
												{/if}
												<button
													type="button"
													disabled={actionLoading[a.id]}
													on:click={() => aufgabeAbgeben(a)}
													class="px-4 py-1.5 text-sm rounded self-end"
													style="background-color: var(--page-color); color: var(--page-bg-color); opacity: {actionLoading[
														a.id
													]
														? 0.6
														: 1};"
												>
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
						{@const teile = teilaufgabenMap.get(aufgabe.uid) ?? []}
						<div
							class="border-b pb-0 md:pb-4 md:rounded-t min-w-0 px-3"
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
									<path
										d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
									/>
								</svg>
							</button>

							<div
								class="accordion-body"
								style="grid-template-rows: {$aufgabenOpenIndex === i ? '1fr' : '0fr'};"
							>
								<div class="overflow-hidden">
									<div class="pb-4 pt-2 flex flex-col gap-8">
										<AufgabeDetails {aufgabe} />

										{#if teile.length > 0}
											<!-- Teilaufgaben: each can be accepted on its own -->
											<div class="flex flex-col gap-2">
												<p class="text-sm font-medium">{$_('Teilaufgaben')}</p>
												<p class="text-sm opacity-60">
													{fortschritt(teile)}{#if aufgabe.enforce_order}
														· {$_('in vorgegebener Reihenfolge')}{/if}
												</p>
												{#if aufgabe.bonus_credits}
													<p class="text-sm">
														{$_('Bonus, wenn du alle Teilaufgaben erledigst:')}
														{aufgabe.bonus_credits}
														{$_('Credits')} ({eigenerFortschritt(teile)})
													</p>
												{/if}
											</div>
											<ol class="flex flex-col gap-6">
												{#each teile as teil, j (teil.uid)}
													<li
														class="flex flex-col gap-4 border-l-2 pl-4"
														style="border-color: var(--page-color);"
													>
														<p class="text-lg font-semibold">
															{aufgabe.enforce_order ? `${j + 1}. ` : ''}{teil.titel}
															{#if teil.erledigt}
																<span class="text-sm font-normal opacity-60"
																	>· {$_('Erledigt')}</span
																>
															{/if}
														</p>
														<AufgabeDetails aufgabe={teil} />
														<AufgabeAnnehmen
															aufgabe={teil}
															loading={actionLoading[teil.uid]}
															error={actionError[teil.uid]}
															accepted={eigeneOffen.has(teil.uid)}
															{haftungsausschlussUrl}
															bind:haftungAccepted
															on:annehmen={() => aufgabeAnnehmen(teil)}
														/>
													</li>
												{/each}
											</ol>
										{:else}
											<!-- Credits + Haftung + Button -->
											<AufgabeAnnehmen
												{aufgabe}
												loading={actionLoading[aufgabe.uid]}
												error={actionError[aufgabe.uid]}
												accepted={eigeneOffen.has(aufgabe.uid)}
												{haftungsausschlussUrl}
												bind:haftungAccepted
												on:annehmen={() => aufgabeAnnehmen(aufgabe)}
											/>
										{/if}
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
