<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';
	$: secret = $page.url.searchParams.get('secret') ?? '';

	function fmtDate(ds: string) {
		if (!ds) return '–';
		return new Date(ds + 'T12:00:00Z').toLocaleDateString('de-CH', {
			weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
		});
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

	let expandedBuchungen = new Set<string>();
	function toggleExpand(id: string) {
		if (expandedBuchungen.has(id)) expandedBuchungen.delete(id);
		else expandedBuchungen.add(id);
		expandedBuchungen = expandedBuchungen;
	}
</script>

<svelte:head><title>Ressource-Buchungen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1100px; margin: 0 auto;">
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 2rem;">
		<a href="/admin/dashboard?secret={secret}" style="font-size: 0.875rem; color: #6b7280;">← Dashboard</a>
		<h1 style="font-size: 1.5rem; font-weight: bold;">Ressource-Buchungen</h1>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">Fehler: {data.blobError}</p>
	{/if}

	{#if data.buchungen.length === 0}
		<p style="opacity: 0.5;">Noch keine Buchungen vorhanden.</p>
	{:else}
		{#each Object.entries(grouped) as [ressourceUid, buchungen]}
			<h2 style="font-size: 1.1rem; font-weight: 600; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb;">
				{ressourceUid} <span style="font-weight: 400; opacity: 0.5; font-size: 0.875rem;">({buchungen.length} Buchung{buchungen.length !== 1 ? 'en' : ''})</span>
			</h2>
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
					<thead>
						<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
							{#each ['Status', 'Anreise', 'Abreise', 'Nächte', 'Personen', 'Total', 'Zimmer', 'Name', 'E-Mail', 'Telefon', 'Buchungs-ID', 'Gebucht am', ''] as col}
								<th style={tdNowrap}>{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each buchungen.sort((x, y) => x.von.localeCompare(y.von)) as b}
							{@const n = naechte(b.von, b.bis)}
							{@const isPast = b.bis < new Date().toISOString().slice(0, 10)}
							<tr style="border-bottom: 1px solid #e5e7eb; {isPast ? 'opacity: 0.45;' : ''}">
								<td style={tdNowrap}>
									{#if b.status === 'confirmed'}
										<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:600;">Bestätigt</span>
									{:else}
										<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:600;">Ausstehend</span>
									{/if}
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
												<li style="font-size: 0.75rem; opacity: 0.8;">{z.zimmer_name || z.bett_typ}</li>
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
										on:click={() => navigator.clipboard.writeText(b.id)}
									>{b.id}</button>
								</td>
								<td style="{tdNowrap} opacity: 0.5; font-size: 0.75rem;">
									{new Date(b.bookedAt).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</td>
								<td style="{tdStyle} display: flex; gap: 0.75rem; align-items: center;">
									{#if b.status !== 'confirmed'}
										<form method="POST" action="?/bestaetigen&secret={secret}">
											<input type="hidden" name="id" value={b.id} />
											<button type="submit" style="color: #065f46; font-size: 0.75rem; background: #d1fae5; border: none; cursor: pointer; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
												✓ Bestätigen
											</button>
										</form>
									{/if}
									<form
										method="POST"
										action="?/delete&secret={secret}"
										on:submit={(e) => confirmDelete(e, `${b.ressourceUid} ${fmtDate(b.von)}`)}
									>
										<input type="hidden" name="id" value={b.id} />
										<button type="submit" style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;">
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
											· Credits erledigt: {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(annahmen.filter(a => a.status === 'erledigt').reduce((s, a) => s + (a.credits ?? 0), 0))}
											· Restbetrag: {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(Math.max(0, b.preisCHF - annahmen.filter(a => a.status === 'erledigt').reduce((s, a) => s + (a.credits ?? 0), 0)))}
										</button>
										{#if expandedBuchungen.has(b.id)}
											<table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; background: #f9fafb;">
												<thead>
													<tr style="border-bottom: 1px solid #e5e7eb;">
														{#each ['Aufgabe', 'Name', 'Status', 'Credits', 'Minuten', 'Erledigt am'] as col}
															<th style="padding: 0.25rem 0.75rem; font-weight: 600; text-align: left; white-space: nowrap;">{col}</th>
														{/each}
													</tr>
												</thead>
												<tbody>
													{#each annahmen as a}
														<tr style="border-bottom: 1px solid #f3f4f6;">
															<td style="padding: 0.25rem 0.75rem;">{a.aufgabeTitel}</td>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;">{a.name}</td>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;">{statusLabels[a.status] ?? a.status}</td>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap;">{a.credits != null ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(a.credits) : '–'}</td>
															<td style="padding: 0.25rem 0.75rem;">{a.minuten != null ? `${a.minuten} min` : '–'}</td>
															<td style="padding: 0.25rem 0.75rem; white-space: nowrap; opacity: 0.6;">{a.erledigtAt ? new Date(a.erledigtAt).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'}</td>
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
