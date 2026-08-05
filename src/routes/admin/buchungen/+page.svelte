<script lang="ts">
	import type { PageData } from './$types';
	import { formatDateWithWeekday } from '$lib/utils/formatDate';
	export let data: PageData;

	import { page } from '$app/stores';

	$: secret = $page.url.searchParams.get('secret') ?? '';

	function confirmDelete(e: SubmitEvent, titel: string) {
		if (!confirm(`Buchung "${titel}" wirklich löschen (Termin wird wieder frei)?`)) return;
		(e.currentTarget as HTMLFormElement).submit();
	}

	function confirmCancel(e: SubmitEvent, titel: string) {
		if (!confirm(`Termin "${titel}" sperren (wird nicht mehr buchbar)?`)) return;
		(e.currentTarget as HTMLFormElement).submit();
	}

	const fmtDate = (datum: string, uhrzeit: string) => formatDateWithWeekday(datum, uhrzeit || null);

	const tdStyle = 'padding: 0.5rem 0.75rem;';
	const tdNowrap = tdStyle + ' white-space: nowrap;';
</script>

<svelte:head><title>Buchungen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1100px; margin: 0 auto;">
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 2rem;">
		<a href="/admin/dashboard?secret={secret}" style="font-size: 0.875rem; color: #6b7280;"
			>← Dashboard</a
		>
		<h1 style="font-size: 1.5rem; font-weight: bold;">Terminverwaltung</h1>
		<a href="/admin/kunden?secret={secret}" style="font-size: 0.875rem; color: #6b7280;">→ Kunden</a
		>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">
			Fehler: {data.blobError}
		</p>
	{/if}

	<!-- Gebuchte Termine -->
	<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">
		Gebuchte Termine ({data.bookings.length})
	</h2>

	{#if data.bookings.length === 0}
		<p style="opacity: 0.5; margin-bottom: 2rem;">Noch keine Buchungen.</p>
	{:else}
		<div style="overflow-x: auto; margin-bottom: 2.5rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Termin', 'Titel', 'Name', 'E-Mail', 'Gebucht am', ''] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as b}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style={tdNowrap}>{fmtDate(b.datum, b.uhrzeit)}</td>
							<td style={tdStyle}>{b.titel || b.terminId}</td>
							<td style={tdStyle}>{b.name ?? '–'}</td>
							<td style={tdStyle}>{b.email ?? '–'}</td>
							<td style="{tdNowrap} opacity: 0.6;">
								{new Date(b.bookedAt).toLocaleString('de-CH', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</td>
							<td style={tdStyle}>
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => confirmDelete(e, b.titel || b.terminId)}
								>
									<input type="hidden" name="id" value={b.terminId} />
									<button
										type="submit"
										style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										Löschen
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Freie Termine -->
	<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem;">
		Freie Termine ({data.freeSlots.length})
	</h2>

	{#if data.freeSlots.length === 0}
		<p style="opacity: 0.5; margin-bottom: 2rem;">Keine freien Termine.</p>
	{:else}
		<div style="overflow-x: auto; margin-bottom: 2.5rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Termin', 'Titel', 'Dauer', 'Zeitzone', ''] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.freeSlots as s}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="{tdNowrap} opacity: 0.8;">{fmtDate(s.datum, s.uhrzeit)}</td>
							<td style={tdStyle}>{s.titel}</td>
							<td style={tdNowrap}>{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
							<td style="{tdStyle} opacity: 0.6;">{s.zeitzone}</td>
							<td style={tdStyle}>
								<form
									method="POST"
									action="?/cancel&secret={secret}"
									on:submit|preventDefault={(e) => confirmCancel(e, s.titel)}
								>
									<input type="hidden" name="id" value={s.id} />
									<button
										type="submit"
										style="color: #d97706; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										Sperren
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Gesperrte Termine -->
	{#if data.cancelledSlots.length > 0}
		<h2 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; opacity: 0.6;">
			Gesperrte Termine ({data.cancelledSlots.length})
		</h2>
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; opacity: 0.7;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Termin', 'Titel', 'Dauer', ''] as col}
							<th style={tdNowrap}>{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.cancelledSlots as s}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="{tdNowrap} text-decoration: line-through;"
								>{fmtDate(s.datum, s.uhrzeit)}</td
							>
							<td style="{tdStyle} text-decoration: line-through;">{s.titel}</td>
							<td style={tdNowrap}>{s.sessionLaenge ? s.sessionLaenge + ' min' : '–'}</td>
							<td style={tdStyle}>
								<form method="POST" action="?/uncancel&secret={secret}">
									<input type="hidden" name="id" value={s.id} />
									<button
										type="submit"
										style="color: #059669; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;"
									>
										Freigeben
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
