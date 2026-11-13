<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import type { EventRegistration } from '$lib/server/eventRegistrations';

	export let data: PageData;

	// Gruppieren nach Event
	const byEvent = new Map<string, { label: string; registrations: EventRegistration[] }>();
	for (const r of data.registrations) {
		if (!byEvent.has(r.eventUid)) {
			byEvent.set(r.eventUid, { label: r.eventLabel, registrations: [] });
		}
		byEvent.get(r.eventUid)!.registrations.push(r);
	}

	const groups = Array.from(byEvent.entries()).map(([uid, g]) => ({ uid, ...g }));

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function fmtEventDateRange(start: string | null, end: string | null): string {
		if (!start) return '';
		const s = new Date(start);
		const sStr = s.toLocaleDateString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
		if (!end) return sStr;
		const e = new Date(end);
		if (s.toDateString() === e.toDateString()) return sStr;
		// Different end date — check if same year
		const eStr = e.toLocaleDateString('de-CH', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
		if (s.getFullYear() === e.getFullYear()) {
			const sShort = s.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
			return `${sShort} – ${eStr}`;
		}
		return `${sStr} – ${eStr}`;
	}

	function fmtAmount(amount: number | null, currency: string) {
		if (amount === null) return '—';
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency,
			currencyDisplay: 'code',
			minimumFractionDigits: 2
		}).format(amount);
	}

	function downloadCsv(group: (typeof groups)[0]) {
		const cols = [
			'Datum',
			'Vorname',
			'Nachname',
			'E-Mail',
			'Betrag',
			'Währung',
			'Zahlungsart',
			'Rechnungsnr.'
		];
		const esc = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
		const rows = group.registrations.map((r) =>
			[
				fmtDate(r.date),
				r.vorname,
				r.nachname,
				r.email ?? '',
				r.amount?.toString() ?? '',
				r.currency,
				r.paymentMethod,
				r.invoiceNumber ?? ''
			]
				.map(esc)
				.join(';')
		);
		const csv = [cols.map(esc).join(';'), ...rows].join('\n');
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
		a.download = `${group.label}-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
	}
</script>

<svelte:head><title>Event Anmeldungen – Admin</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="Event Anmeldungen" count={data.registrations.length}>
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm('Alle Anmeldungen löschen?')) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">Alle löschen</button>
		</form>
	</AdminHeader>

	{#if data.registrations.length === 0}
		<p class="admin-empty">Noch keine Anmeldungen vorhanden.</p>
	{:else}
		{#each groups as group}
			<section class="admin-card">
				<div class="admin-card-title">
					<h2>{group.label}</h2>
					{#if data.eventDates[group.uid]?.start}
						<span class="admin-muted text-sm">
							{fmtEventDateRange(data.eventDates[group.uid].start, data.eventDates[group.uid].end)}
						</span>
					{/if}
					<div class="ml-auto flex items-center gap-2">
						<span class="admin-muted text-sm"
							>{group.registrations.length} Anmeldung{group.registrations.length !== 1
								? 'en'
								: ''}</span
						>
						<button type="button" class="admin-btn admin-btn-sm" on:click={() => downloadCsv(group)}
							>↓ CSV</button
						>
						<a
							href="/admin/event-anmeldungen/download?uid={encodeURIComponent(group.uid)}"
							class="admin-btn admin-btn-sm">↓ PDF</a
						>
					</div>
				</div>

				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>Datum</th>
								<th>Name</th>
								<th>E-Mail</th>
								<th>Betrag</th>
								<th>Zahlung</th>
								<th>Rechnung</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each group.registrations as r}
								<tr>
									<td class="nowrap admin-muted">{fmtDate(r.date)}</td>
									<td class="nowrap">{r.vorname} {r.nachname}</td>
									<td>{r.email ?? '—'}</td>
									<td class="nowrap tabular-nums">{fmtAmount(r.amount, r.currency)}</td>
									<td>
										<span
											class="admin-badge {r.paymentMethod === 'rechnung'
												? 'admin-badge-blue'
												: 'admin-badge-green'}"
										>
											{r.paymentMethod === 'rechnung' ? 'Rechnung' : 'Bar'}
										</span>
									</td>
									<td class="nowrap admin-muted text-xs">{r.invoiceNumber}</td>
									<td>
										<form
											method="POST"
											action="?/delete"
											on:submit={(e) => {
												if (!confirm('Eintrag löschen?')) e.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={r.id} />
											<button type="submit" class="admin-link-danger text-xs">Löschen</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/each}
	{/if}
</div>
