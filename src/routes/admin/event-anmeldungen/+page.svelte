<script lang="ts">
	import type { PageData } from './$types';
	import type { EventRegistration } from '$lib/server/eventRegistrations';

	export let data: PageData;

	const s = data.secret;

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
</script>

<svelte:head><title>Event Anmeldungen – Admin</title></svelte:head>

<div style="font-family: sans-serif; min-height: 100vh; background: #f9fafb; padding: 2rem 1.5rem;">
	<div style="max-width: 900px; margin: 0 auto;">
		<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
			<a
				href="/admin/dashboard?secret={s}"
				style="color: #6b7280; text-decoration: none; font-size: 0.875rem;">← Dashboard</a
			>
			<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Event Anmeldungen</h1>
		</div>

		{#if data.registrations.length === 0}
			<p style="color: #6b7280;">Noch keine Anmeldungen vorhanden.</p>
		{:else}
			{#each groups as group}
				<div
					style="background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; overflow: hidden;"
				>
					<div
						style="padding: 1rem 1.25rem; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;"
					>
						<div>
							<span style="font-weight: 600;">{group.label}</span>
							{#if data.eventDates[group.uid]?.start}
								<span style="font-size: 0.8rem; color: #374151; margin-left: 0.5rem;">
									{fmtEventDateRange(
										data.eventDates[group.uid].start,
										data.eventDates[group.uid].end
									)}
								</span>
							{/if}
						</div>
						<span style="font-size: 0.875rem; color: #374151;"
							>{group.registrations.length} Anmeldung{group.registrations.length !== 1
								? 'en'
								: ''}</span
						>
					</div>

					<div style="overflow-x: auto;">
						<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
							<thead>
								<tr style="border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: left;">
									<th style="padding: 0.625rem 1.25rem; font-weight: 500;">Datum</th>
									<th style="padding: 0.625rem 1rem; font-weight: 500;">Name</th>
									<th style="padding: 0.625rem 1rem; font-weight: 500;">E-Mail</th>

									<th style="padding: 0.625rem 1rem; font-weight: 500;">Betrag</th>
									<th style="padding: 0.625rem 1rem; font-weight: 500;">Zahlung</th>
									<th style="padding: 0.625rem 1.25rem 0.625rem 1rem; font-weight: 500;"
										>Rechnung</th
									>
									<th style="padding: 0.625rem 1rem; font-weight: 500;"></th>
									<th style="padding: 0.625rem 1rem; font-weight: 500;"></th>
								</tr>
							</thead>
							<tbody>
								{#each group.registrations as r}
									<tr style="border-bottom: 1px solid #f3f4f6;">
										<td style="padding: 0.625rem 1.25rem; white-space: nowrap; color: #6b7280;"
											>{fmtDate(r.date)}</td
										>
										<td style="padding: 0.625rem 1rem; white-space: nowrap;"
											>{r.vorname} {r.nachname}</td
										>
										<td style="padding: 0.625rem 1rem;">{r.email ?? '—'}</td>
										<td
											style="padding: 0.625rem 1rem; white-space: nowrap; font-variant-numeric: tabular-nums;"
											>{fmtAmount(r.amount, r.currency)}</td
										>
										<td style="padding: 0.625rem 1rem;">
											<span
												style="display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; background: {r.paymentMethod ===
												'rechnung'
													? '#dbeafe'
													: '#d1fae5'}; color: {r.paymentMethod === 'rechnung'
													? '#1d4ed8'
													: '#065f46'};"
											>
												{r.paymentMethod === 'rechnung' ? 'Rechnung' : 'Bar'}
											</span>
										</td>
										<td
											style="padding: 0.625rem 1.25rem 0.625rem 1rem; white-space: nowrap; font-size: 0.75rem; color: #6b7280;"
											>{r.invoiceNumber}</td
										>
										<td style="padding: 0.625rem 1rem;">
											<form
												method="POST"
												action="?/delete&secret={s}"
												on:submit={(e) => {
													if (!confirm('Eintrag löschen?')) e.preventDefault();
												}}
											>
												<input type="hidden" name="id" value={r.id} />
												<button
													type="submit"
													style="background: none; border: none; cursor: pointer; color: #dc2626; font-size: 0.75rem; padding: 0;"
													>Löschen</button
												>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
