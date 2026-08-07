<script lang="ts">
	import type { PageData } from './$types';
	import Button from '$lib/components/Button.svelte';
	import type { EventRegistration } from '$lib/server/eventRegistrations';
	import Bounded from '$lib/components/Bounded.svelte';

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

	let openDownloadMenu: string | null = null;
</script>

<svelte:head><title>Event Anmeldungen – Admin</title></svelte:head>

<Bounded
	tag="div"
	yPadding="sm"
	style="font-family: sans-serif; min-height: 100vh; background: #f9fafb;"
>
	<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">Event Anmeldungen</h1>
		<div style="margin-left: auto; display: flex; gap: 0.5rem; align-items: center;">
			<Button
				href="/admin/dashboard?secret={s}"
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
				action="?/deleteAll&secret={s}"
				on:submit={(e) => {
					if (!confirm('Alle Anmeldungen löschen?')) e.preventDefault();
				}}
			>
				<input type="hidden" name="secret" value={s} />
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
					<div style="display: flex; align-items: center; gap: 0.75rem;">
						<span style="font-size: 0.875rem; color: #374151;"
							>{group.registrations.length} Anmeldung{group.registrations.length !== 1
								? 'en'
								: ''}</span
						>
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div style="position: relative;" on:mouseleave={() => (openDownloadMenu = null)}>
							<Button
								text="↓ Liste ▾"
								color="#065f46"
								bgColor="transparent"
								hoverColor="#064e3b"
								hoverBgColor="transparent"
								size="sm"
								mb={false}
								on:click={() =>
									(openDownloadMenu = openDownloadMenu === group.uid ? null : group.uid)}
							/>
							{#if openDownloadMenu === group.uid}
								<div
									style="position: absolute; right: 0; top: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 110px; z-index: 50;"
								>
									<button
										on:click={() => {
											downloadCsv(group);
											openDownloadMenu = null;
										}}
										style="display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; font-size: 0.875rem; background: none; border: none; cursor: pointer; font-family: sans-serif;"
										>CSV</button
									>
									<a
										href="/admin/event-anmeldungen/download?secret={s}&uid={encodeURIComponent(
											group.uid
										)}"
										style="display: block; padding: 0.5rem 1rem; font-size: 0.875rem; color: inherit; text-decoration: none;"
										on:click={() => (openDownloadMenu = null)}>PDF</a
									>
								</div>
							{/if}
						</div>
					</div>
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
								<th style="padding: 0.625rem 1.25rem 0.625rem 1rem; font-weight: 500;">Rechnung</th>
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
</Bounded>
