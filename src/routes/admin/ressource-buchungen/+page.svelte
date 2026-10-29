<script lang="ts">
	import type { PageData } from './$types';
	import SvgIcons from '$lib/components/SvgIcons.svelte';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	export let data: PageData;

	function fmtDate(ds: string | null | undefined) {
		if (!ds) return '–';
		const [year, month, day] = ds.slice(0, 10).split('-');
		if (!year || !month || !day) return ds;
		return `${day}.${month}.${year}`;
	}

	function reminderSent(b: any): boolean {
		return !!(b as any).reminderSent;
	}

	function abreiseReminderSent(b: any): boolean {
		return !!(b as any).abreiseReminderSent;
	}

	function fmtPrice(chf: number) {
		return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(chf);
	}

	function naechte(von: string, bis: string) {
		return Math.round((new Date(bis).getTime() - new Date(von).getTime()) / 86400000);
	}

	function confirmDelete(e: SubmitEvent, label: string) {
		if (!confirm(`Buchung "${label}" wirklich löschen?`)) e.preventDefault();
	}

	// Group by ressourceUid
	$: grouped = data.buchungen.reduce<Record<string, typeof data.buchungen>>((acc, b) => {
		(acc[b.ressourceUid] ??= []).push(b);
		return acc;
	}, {});

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		erledigt: 'Erledigt'
	};

	// Buchungs-Status
	const STATUS_FLOW = ['pending', 'confirmed', 'checked_in', 'checked_out', 'abgerechnet'] as const;
	type BStatus = (typeof STATUS_FLOW)[number];

	const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
		pending: { label: 'Ausstehend', badge: 'admin-badge-yellow' },
		confirmed: { label: 'Bestätigt', badge: 'admin-badge-green' },
		checked_in: { label: 'Eingecheckt', badge: 'admin-badge-blue' },
		checked_out: { label: 'Ausgecheckt', badge: '' },
		abgerechnet: { label: 'Abgerechnet', badge: 'admin-badge-purple' }
	};

	const fmtCHF = (n: number) =>
		new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n);
	const fmtDateTime = (iso: string) =>
		new Date(iso).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	const creditsErledigt = (annahmen: { status: string; credits?: number }[]) =>
		annahmen.filter((a) => a.status === 'erledigt').reduce((s, a) => s + (a.credits ?? 0), 0);

	// Vorwärts-Action pro Status
	const NEXT_ACTION: Record<string, string | null> = {
		pending: 'bestaetigen',
		confirmed: 'checkin',
		checked_in: 'checkout',
		checked_out: null, // → Link zur Freigabe-Seite
		abgerechnet: null
	};
	const NEXT_LABEL: Record<string, string> = {
		pending: '✉ Bestätigen → Bestätigungsmail an Mieter (+ ggf. Ankunftserinnerung)',
		confirmed: '✉ Check-in → Benachrichtigung an Betreiber',
		checked_in: '✉ Check-out → Abrechnungsmail an Betreiber (Freigabe-Link)',
		checked_out: '✉ Abrechnung freigeben → Definitive Abrechnung an Mieter'
	};

	function nextAction(b: any): string | null {
		if (b.status === 'checked_in' && !abreiseReminderSent(b)) return 'sendAbreiseReminder';
		return NEXT_ACTION[b.status];
	}

	function nextLabel(b: any): string {
		if (b.status === 'checked_in' && !abreiseReminderSent(b)) {
			return '✉ Vor Abreise → Abreise-Mail an Mieter';
		}
		return NEXT_LABEL[b.status];
	}

	let expandedBuchungen = new Set<string>();
	function toggleExpand(id: string) {
		if (expandedBuchungen.has(id)) expandedBuchungen.delete(id);
		else expandedBuchungen.add(id);
		expandedBuchungen = expandedBuchungen;
	}

	let showCreate = false;
</script>

<svelte:head><title>Ressource-Buchungen</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="Ressource-Buchungen" count={data.buchungen.length}>
		<button
			type="button"
			on:click={() => (showCreate = !showCreate)}
			class="admin-btn admin-btn-primary">+ Neue Buchung</button
		>
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm('Alle Buchungen löschen?')) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">Alle löschen</button>
		</form>
	</AdminHeader>

	{#if data.blobError}
		<p class="admin-notice admin-notice-error admin-mono">Fehler: {data.blobError}</p>
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/create"
			class="admin-card grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3"
		>
			<h2 class="col-span-full">Neue Buchung erfassen</h2>
			{#each [{ name: 'ressourceUid', label: 'Ressource UID *', type: 'text' }, { name: 'von', label: 'Anreise *', type: 'date' }, { name: 'bis', label: 'Abreise *', type: 'date' }, { name: 'personen', label: 'Personen *', type: 'number' }, { name: 'name', label: 'Name *', type: 'text' }, { name: 'email', label: 'E-Mail *', type: 'email' }, { name: 'telefon', label: 'Telefon', type: 'text' }, { name: 'preisCHF', label: 'Preis CHF', type: 'number' }, { name: 'nachricht', label: 'Nachricht', type: 'text' }] as f}
				<label class="admin-label">
					{f.label}
					<input
						name={f.name}
						type={f.type}
						min={f.name === 'personen' ? 1 : f.name === 'preisCHF' ? 0 : undefined}
						step={f.name === 'preisCHF' ? '0.01' : undefined}
						class="admin-input admin-input-sm mt-1"
					/>
				</label>
			{/each}
			<label class="admin-label">
				Status
				<select name="status" class="admin-input admin-input-sm mt-1">
					<option value="confirmed">Bestätigt</option>
					<option value="pending">Ausstehend</option>
					<option value="checked_in">Eingecheckt</option>
				</select>
			</label>
			<div class="col-span-full flex gap-2">
				<button type="submit" class="admin-btn admin-btn-primary">Speichern</button>
				<button type="button" on:click={() => (showCreate = false)} class="admin-btn"
					>Abbrechen</button
				>
			</div>
		</form>
	{/if}

	{#if data.buchungen.length === 0}
		<p class="admin-empty">Noch keine Buchungen vorhanden.</p>
	{:else}
		{#each Object.entries(grouped) as [ressourceUid, buchungen]}
			<section class="admin-card">
				<h2 class="admin-card-title">
					{ressourceUid}
					<span class="admin-count"
						>({buchungen.length} Buchung{buchungen.length !== 1 ? 'en' : ''})</span
					>
				</h2>
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								{#each ['Status', 'Anreise', 'Abreise', 'Nächte', 'Personen', 'Total', 'Zimmer', 'Name', 'E-Mail', 'Telefon', 'Buchungs-ID', 'Gebucht am', 'Reminder', 'Aktionen'] as col}
									<th>{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each buchungen as b}
								{@const n = naechte(b.von, b.bis)}
								{@const isPast = b.bis < new Date().toISOString().slice(0, 10)}
								{@const s = STATUS_LABELS[b.status] ?? { label: b.status ?? '–', badge: '' }}
								{@const annahmen = data.annahmenMap?.[b.id] ?? []}
								<tr class:admin-row-muted={isPast}>
									<td class="nowrap"><span class="admin-badge {s.badge}">{s.label}</span></td>
									<td class="nowrap">{fmtDate(b.von)}</td>
									<td class="nowrap">{fmtDate(b.bis)}</td>
									<td class="nowrap text-right">{n}</td>
									<td class="nowrap text-right">{b.personen}</td>
									<td class="nowrap text-right">{fmtPrice(b.preisCHF)}</td>
									<td>
										{#if b.zimmerauswahl?.length}
											<ul class="m-0 list-none p-0 text-xs">
												{#each b.zimmerauswahl as z}
													<li>{z.zimmer_name || z.bett_typ}</li>
												{/each}
											</ul>
										{:else}
											<span class="admin-muted">–</span>
										{/if}
									</td>
									<td>{b.name ?? '–'}</td>
									<td>
										{#if b.email}
											<a href="mailto:{b.email}" class="admin-link font-normal">{b.email}</a>
										{:else}–{/if}
									</td>
									<td>{b.telefon ?? '–'}</td>
									<td class="max-w-[160px]">
										<button
											type="button"
											title="Klicken zum Kopieren"
											class="admin-mono block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-inherit"
											on:click={() => navigator.clipboard.writeText(b.id)}>{b.id}</button
										>
									</td>
									<td class="nowrap admin-muted text-xs">{fmtDateTime(b.bookedAt)}</td>
									<td class="nowrap">
										{#if reminderSent(b)}
											<span class="admin-badge admin-badge-green">✓ gesendet</span>
										{:else}
											<span class="admin-muted text-xs">–</span>
										{/if}
									</td>
									<td>
										<div class="flex flex-wrap items-center gap-2">
											{#if b.status !== 'pending'}
												<form method="POST" action="?/zurueck">
													<input type="hidden" name="id" value={b.id} />
													<button
														type="submit"
														title="Einen Schritt zurück (kein Mail)"
														class="admin-btn admin-btn-sm"
													>
														<SvgIcons name="left" size="1em" color="currentColor" />
													</button>
												</form>
											{/if}
											{#if b.status !== 'abgerechnet'}
												<form method="POST" action="?/voraus">
													<input type="hidden" name="id" value={b.id} />
													<button
														type="submit"
														title="Einen Schritt voraus (kein Mail)"
														class="admin-btn admin-btn-sm"
													>
														<SvgIcons name="right" size="1em" color="currentColor" />
													</button>
												</form>
											{/if}
											{#if nextAction(b)}
												<form method="POST" action="?/{nextAction(b)}">
													<input type="hidden" name="id" value={b.id} />
													<button type="submit" class="admin-btn admin-btn-dark admin-btn-sm"
														>{nextLabel(b)}</button
													>
												</form>
											{:else if b.status === 'checked_out'}
												<a
													href="/api/freigabe-abrechnung?id={encodeURIComponent(b.id)}"
													target="_blank"
													class="admin-btn admin-btn-primary admin-btn-sm">{NEXT_LABEL[b.status]}</a
												>
											{/if}
											{#if b.status === 'confirmed' || b.status === 'checked_in'}
												<form method="POST" action="?/sendReminder">
													<input type="hidden" name="id" value={b.id} />
													<button
														type="submit"
														title="Ankunfts-Reminder jetzt senden{reminderSent(b)
															? ' (erneut)'
															: ''}"
														class="admin-btn admin-btn-sm"
														class:admin-btn-highlight={!reminderSent(b)}
														>📧{reminderSent(b) ? ' ↺' : ''}</button
													>
												</form>
											{/if}
											{#if b.status === 'checked_in' || b.status === 'checked_out'}
												<form method="POST" action="?/sendAbreiseReminder">
													<input type="hidden" name="id" value={b.id} />
													<button
														type="submit"
														title="Abreise-Reminder jetzt senden{abreiseReminderSent(b)
															? ' (erneut)'
															: ''}"
														class="admin-btn admin-btn-sm"
														class:admin-btn-highlight={!abreiseReminderSent(b)}
														>✈{abreiseReminderSent(b) ? ' ↺' : ''}</button
													>
												</form>
											{/if}
											<form
												method="POST"
												action="?/delete"
												on:submit={(e) => confirmDelete(e, `${b.ressourceUid} ${fmtDate(b.von)}`)}
											>
												<input type="hidden" name="id" value={b.id} />
												<button type="submit" class="admin-link-danger text-xs">Löschen</button>
											</form>
										</div>
									</td>
								</tr>
								{#if annahmen.length > 0}
									<tr>
										<td colspan="14" class="p-0">
											<button
												type="button"
												on:click={() => toggleExpand(b.id)}
												class="admin-subrow-toggle"
											>
												{expandedBuchungen.has(b.id) ? '▾' : '▸'}
												{annahmen.length} Aufgabe{annahmen.length !== 1 ? 'n' : ''}
												· Credits erledigt: {fmtCHF(creditsErledigt(annahmen))}
												· Restbetrag: {fmtCHF(Math.max(0, b.preisCHF - creditsErledigt(annahmen)))}
											</button>
											{#if expandedBuchungen.has(b.id)}
												<table class="admin-table admin-subtable">
													<thead>
														<tr>
															{#each ['Aufgabe', 'Name', 'Status', 'Credits', 'Minuten', 'Erledigt am'] as col}
																<th>{col}</th>
															{/each}
														</tr>
													</thead>
													<tbody>
														{#each annahmen as a}
															<tr>
																<td>{a.aufgabeTitel}</td>
																<td class="nowrap">{a.name}</td>
																<td class="nowrap">{statusLabels[a.status] ?? a.status}</td>
																<td class="nowrap">{a.credits != null ? fmtCHF(a.credits) : '–'}</td
																>
																<td>{a.minuten != null ? `${a.minuten} min` : '–'}</td>
																<td class="nowrap admin-muted"
																	>{a.erledigtAt ? fmtDateTime(a.erledigtAt) : '–'}</td
																>
															</tr>
														{/each}
													</tbody>
												</table>
											{/if}
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/each}
	{/if}
</div>
