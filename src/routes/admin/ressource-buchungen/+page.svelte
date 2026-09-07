<script lang="ts">
	import type { PageData } from './$types';
	import Button from '$lib/components/Button.svelte';
	export let data: PageData;

	import { page } from '$app/stores';
	$: secret = $page.url.searchParams.get('secret') ?? '';

	function fmtDate(ds: string | null | undefined) {
		if (!ds) return '–';
		const [year, month, day] = ds.slice(0, 10).split('-');
		if (!year || !month || !day) return ds;
		return `${day}.${month}.${year}`;
	}

	function reminderSent(b: any): boolean {
		return !!(b as any).reminderSent;
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

	const tdStyle = 'padding: 0.5rem 0.75rem;';
	const tdNowrap = tdStyle + ' white-space: nowrap;';

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		erledigt: 'Erledigt'
	};

	// Buchungs-Status
	const STATUS_FLOW = ['pending', 'confirmed', 'checked_in', 'checked_out', 'abgerechnet'] as const;
	type BStatus = (typeof STATUS_FLOW)[number];

	const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
		pending: { label: 'Ausstehend', bg: '#fef3c7', color: '#92400e' },
		confirmed: { label: 'Bestätigt', bg: '#d1fae5', color: '#065f46' },
		checked_in: { label: 'Eingecheckt', bg: '#dbeafe', color: '#1e40af' },
		checked_out: { label: 'Ausgecheckt', bg: '#f3f4f6', color: '#374151' },
		abgerechnet: { label: 'Abgerechnet', bg: '#ede9fe', color: '#5b21b6' }
	};

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

	let expandedBuchungen = new Set<string>();
	function toggleExpand(id: string) {
		if (expandedBuchungen.has(id)) expandedBuchungen.delete(id);
		else expandedBuchungen.add(id);
		expandedBuchungen = expandedBuchungen;
	}

	let showCreate = false;
</script>

<svelte:head><title>Ressource-Buchungen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1100px; margin: 0 auto;">
	<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Ressource-Buchungen</h1>
		<div style="margin-left: auto; display: flex; gap: 0.5rem; align-items: center;">
			<button
				type="button"
				on:click={() => (showCreate = !showCreate)}
				style="font-size:0.8rem;background:#1e2d5a;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:4px 10px;font-weight:600;"
				>+ Neue Buchung</button
			>
			<Button
				href="/admin/dashboard?secret={secret}"
				text="← Dashboard"
				color="#374151"
				bgColor="transparent"
				hoverColor="#111827"
				hoverBgColor="transparent"
				size="sm"
				mb={false}
			/>
			<form
				method="POST"
				action="?/deleteAll&secret={secret}"
				on:submit={(e) => {
					if (!confirm('Alle Buchungen löschen?')) e.preventDefault();
				}}
			>
				<input type="hidden" name="secret" value={secret} />
				<Button
					text="Alle löschen"
					color="#dc2626"
					bgColor="transparent"
					hoverColor="#991b1b"
					hoverBgColor="transparent"
					size="sm"
					mb={false}
				/>
			</form>
		</div>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">
			Fehler: {data.blobError}
		</p>
	{/if}

	{#if showCreate}
		<form
			method="POST"
			action="?/create&secret={secret}"
			style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:1.25rem;margin-bottom:2rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;"
		>
			<h3 style="grid-column:1/-1;margin:0 0 0.25rem;font-size:0.95rem;font-weight:700;">
				Neue Buchung erfassen
			</h3>
			{#each [{ name: 'ressourceUid', label: 'Ressource UID *', type: 'text' }, { name: 'von', label: 'Anreise *', type: 'date' }, { name: 'bis', label: 'Abreise *', type: 'date' }, { name: 'personen', label: 'Personen *', type: 'number' }, { name: 'name', label: 'Name *', type: 'text' }, { name: 'email', label: 'E-Mail *', type: 'email' }, { name: 'telefon', label: 'Telefon', type: 'text' }, { name: 'preisCHF', label: 'Preis CHF', type: 'number' }, { name: 'nachricht', label: 'Nachricht', type: 'text' }] as f}
				<label style="font-size:0.8rem;display:flex;flex-direction:column;gap:2px;">
					{f.label}
					<input
						name={f.name}
						type={f.type}
						min={f.name === 'personen' ? 1 : f.name === 'preisCHF' ? 0 : undefined}
						step={f.name === 'preisCHF' ? '0.01' : undefined}
						style="border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;font-size:0.8rem;width:100%;"
					/>
				</label>
			{/each}
			<label style="font-size:0.8rem;display:flex;flex-direction:column;gap:2px;">
				Status
				<select
					name="status"
					style="border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;font-size:0.8rem;"
				>
					<option value="confirmed">Bestätigt</option>
					<option value="pending">Ausstehend</option>
					<option value="checked_in">Eingecheckt</option>
				</select>
			</label>
			<div style="grid-column:1/-1;display:flex;gap:0.5rem;margin-top:0.25rem;">
				<button
					type="submit"
					style="background:#1e2d5a;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:5px 14px;font-size:0.8rem;font-weight:600;"
					>Speichern</button
				>
				<button
					type="button"
					on:click={() => (showCreate = false)}
					style="background:none;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;padding:5px 14px;font-size:0.8rem;"
					>Abbrechen</button
				>
			</div>
		</form>
	{/if}

	{#if data.buchungen.length === 0}
		<p style="opacity: 0.5;">Noch keine Buchungen vorhanden.</p>
	{:else}
		{#each Object.entries(grouped) as [ressourceUid, buchungen]}
			<h2
				style="font-size: 1.1rem; font-weight: 600; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb;"
			>
				{ressourceUid}
				<span style="font-weight: 400; opacity: 0.5; font-size: 0.875rem;"
					>({buchungen.length} Buchung{buchungen.length !== 1 ? 'en' : ''})</span
				>
			</h2>
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
					<thead>
						<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
							{#each ['Status', 'Anreise', 'Abreise', 'Nächte', 'Personen', 'Total', 'Zimmer', 'Name', 'E-Mail', 'Telefon', 'Buchungs-ID', 'Gebucht am', 'Reminder', 'Aktionen'] as col}
								<th style={tdNowrap}>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each buchungen as b}
							{@const n = naechte(b.von, b.bis)}
							{@const isPast = b.bis < new Date().toISOString().slice(0, 10)}
							{@const s = STATUS_LABELS[b.status] ?? {
								label: b.status,
								bg: '#f3f4f6',
								color: '#374151'
							}}
							<tr style="border-bottom: 1px solid #e5e7eb; {isPast ? 'opacity: 0.45;' : ''}">
								<td style={tdNowrap}>
									<span
										style="background:{s.bg};color:{s.color};padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:600;"
										>{s.label}</span
									>
								</td>
								<td style={tdNowrap}>{fmtDate(b.von)}</td>
								<td style={tdNowrap}>{fmtDate(b.bis)}</td>
								<td style="{tdNowrap} text-align: right;">{n}</td>
								<td style="{tdNowrap} text-align: right;">{b.personen}</td>
								<td style="{tdNowrap} text-align: right;">{fmtPrice(b.preisCHF)}</td>
								<td style={tdStyle}>
									{#if b.zimmerauswahl?.length}
										<ul style="margin: 0; padding: 0; list-style: none;">
											{#each b.zimmerauswahl as z}
												<li style="font-size: 0.75rem; opacity: 0.8;">
													{z.zimmer_name || z.bett_typ}
												</li>
											{/each}
										</ul>
									{:else}
										<span style="opacity: 0.4;">–</span>
									{/if}
								</td>
								<td style={tdStyle}>{b.name ?? '–'}</td>
								<td style={tdStyle}>
									{#if b.email}
										<a href="mailto:{b.email}" style="color: #2563eb;">{b.email}</a>
									{:else}–{/if}
								</td>
								<td style={tdStyle}>{b.telefon ?? '–'}</td>
								<td style="{tdStyle} font-family: monospace; font-size: 0.7rem; max-width: 160px;">
									<button
										type="button"
										title="Klicken zum Kopieren"
										style="cursor: pointer; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; background: none; border: none; padding: 0; font-family: monospace; font-size: 0.7rem; color: inherit;"
										on:click={() => navigator.clipboard.writeText(b.id)}>{b.id}</button
									>
								</td>
								<td style="{tdNowrap} opacity: 0.5; font-size: 0.75rem;">
									{new Date(b.bookedAt).toLocaleString('de-CH', {
										day: '2-digit',
										month: '2-digit',
										year: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</td>
								<td style={tdNowrap}>
									{#if reminderSent(b)}
										<span
											style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:600;"
											>✓ gesendet</span
										>
									{:else}
										<span style="opacity: 0.35; font-size: 0.75rem;">–</span>
									{/if}
								</td>
								<td
									style="{tdStyle} display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;"
								>
									<!-- Zurück -->
									{#if b.status !== 'pending'}
										<form method="POST" action="?/zurueck&secret={secret}">
											<input type="hidden" name="id" value={b.id} />
											<button
												type="submit"
												title="Einen Schritt zurück (kein Mail)"
												style="font-size:0.75rem;background:none;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;padding:2px 7px;color:#6b7280;"
											>
												←
											</button>
										</form>
									{/if}
									<!-- Voraus ohne Mail -->
									{#if b.status !== 'abgerechnet'}
										<form method="POST" action="?/voraus&secret={secret}">
											<input type="hidden" name="id" value={b.id} />
											<button
												type="submit"
												title="Einen Schritt voraus (kein Mail)"
												style="font-size:0.75rem;background:none;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;padding:2px 7px;color:#6b7280;"
											>
												→
											</button>
										</form>
									{/if}
									<!-- Vorwärts -->
									{#if NEXT_ACTION[b.status]}
										<form method="POST" action="?/{NEXT_ACTION[b.status]}&secret={secret}">
											<input type="hidden" name="id" value={b.id} />
											<button
												type="submit"
												style="font-size:0.7rem;background:#1e2d5a;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:2px 8px;font-weight:600;white-space:nowrap;"
											>
												{NEXT_LABEL[b.status]}
											</button>
										</form>
									{:else if b.status === 'checked_out'}
										<a
											href="/api/freigabe-abrechnung?id={encodeURIComponent(b.id)}&secret={secret}"
											target="_blank"
											style="font-size:0.7rem;background:#5b21b6;color:#fff;border-radius:4px;padding:2px 8px;font-weight:600;text-decoration:none;white-space:nowrap;"
											>{NEXT_LABEL[b.status]}</a
										>
									{/if}
									<!-- Reminder senden -->
									{#if b.status === 'confirmed' || b.status === 'checked_in'}
										<form method="POST" action="?/sendReminder&secret={secret}">
											<input type="hidden" name="id" value={b.id} />
											<button
												type="submit"
												title="Ankunfts-Reminder jetzt senden{b.reminderSent ? ' (erneut)' : ''}"
												style="font-size:0.7rem;background:{b.reminderSent
													? '#f3f4f6'
													: '#fef9c3'};color:{b.reminderSent
													? '#6b7280'
													: '#92400e'};border:1px solid {b.reminderSent
													? '#d1d5db'
													: '#fcd34d'};border-radius:4px;cursor:pointer;padding:2px 7px;white-space:nowrap;"
												>📧{b.reminderSent ? ' ↺' : ''}</button
											>
										</form>
									{/if}
									<!-- Löschen -->
									<form
										method="POST"
										action="?/delete&secret={secret}"
										on:submit={(e) => confirmDelete(e, `${b.ressourceUid} ${fmtDate(b.von)}`)}
									>
										<input type="hidden" name="id" value={b.id} />
										<button
											type="submit"
											style="color:#dc2626;font-size:0.75rem;background:none;border:none;cursor:pointer;padding:0;"
										>
											Löschen
										</button>
									</form>
								</td>
							</tr>
							{@const annahmen = data.annahmenMap?.[b.id] ?? []}
							{#if annahmen.length > 0}
								<tr>
									<td colspan="13" style="padding: 0;">
										<button
											type="button"
											on:click={() => toggleExpand(b.id)}
											style="width: 100%; text-align: left; padding: 0.375rem 0.75rem; background: #f0fdf4; border: none; border-top: 1px solid #d1fae5; cursor: pointer; font-size: 0.75rem; color: #065f46;"
										>
											{expandedBuchungen.has(b.id) ? '▾' : '▸'}
											{annahmen.length} Aufgabe{annahmen.length !== 1 ? 'n' : ''}
											· Credits erledigt: {new Intl.NumberFormat('de-CH', {
												style: 'currency',
												currency: 'CHF'
											}).format(
												annahmen
													.filter((a) => a.status === 'erledigt')
													.reduce((s, a) => s + (a.credits ?? 0), 0)
											)}
											· Restbetrag: {new Intl.NumberFormat('de-CH', {
												style: 'currency',
												currency: 'CHF'
											}).format(
												Math.max(
													0,
													b.preisCHF -
														annahmen
															.filter((a) => a.status === 'erledigt')
															.reduce((s, a) => s + (a.credits ?? 0), 0)
												)
											)}
										</button>
										{#if expandedBuchungen.has(b.id)}
											<table
												style="width: 100%; border-collapse: collapse; font-size: 0.75rem; background: #f9fafb;"
											>
												<thead>
													<tr style="border-bottom: 1px solid #e5e7eb;">
														{#each ['Aufgabe', 'Name', 'Status', 'Credits', 'Minuten', 'Erledigt am'] as col}
															<th
																style="padding: 0.25rem 0.75rem; font-weight: 600; text-align: left; white-space: nowrap;"
																>{col}</th
															>
														{/each}
													</tr>
												</thead>
												<tbody>
													{#each annahmen as a}
														<tr style="border-bottom: 1px solid #f3f4f6;">
															<td style="padding: 0.25rem 0.75rem;">{a.aufgabeTitel}</td>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;"
																>{a.name}</td
															>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;"
																>{statusLabels[a.status] ?? a.status}</td
															>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;"
																>{a.credits != null
																	? new Intl.NumberFormat('de-CH', {
																			style: 'currency',
																			currency: 'CHF'
																		}).format(a.credits)
																	: '–'}</td
															>
															<td style="padding: 0.25rem 0.75rem;"
																>{a.minuten != null ? `${a.minuten} min` : '–'}</td
															>
															<td
																style="padding: 0.25rem 0.75rem; white-space: nowrap; opacity: 0.6;"
																>{a.erledigtAt
																	? new Date(a.erledigtAt).toLocaleString('de-CH', {
																			day: '2-digit',
																			month: '2-digit',
																			year: 'numeric',
																			hour: '2-digit',
																			minute: '2-digit'
																		})
																	: '–'}</td
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
		{/each}
	{/if}
</div>
