<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';

	const cols = ['Datum', 'Name', 'E-Mail', 'Firma', 'Dienstleistung', 'Betrag', 'Zahlung', ''];
	$: secret = $page.url.searchParams.get('secret') ?? '';

	function fmt(c: (typeof data.customers)[0]) {
		const name = [c.vorname, c.nachname].filter(Boolean).join(' ') || '–';
		const date = new Date(c.date).toLocaleString('de-CH', {
			day: '2-digit', month: '2-digit', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
		const amount = c.amount != null ? `${c.amount} ${c.currency}` : '–';
		return { date, name, email: c.email ?? '–', firma: c.firma ?? '–', service: c.service, amount, method: c.paymentMethod };
	}
</script>

<svelte:head><title>Kundenliste</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto;">
	<h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem;">
		Kunden ({data.customers.length})
	</h1>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem;">Fehler: {data.blobError}</p>
	{/if}

	{#if data.customers.length === 0}
		<p style="opacity: 0.5;">Noch keine Einträge.</p>
	{:else}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each cols as col}
							<th style="padding: 0.5rem 0.75rem; white-space: nowrap;">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.customers as c}
						{@const r = fmt(c)}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap; opacity: 0.6;">{r.date}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.name}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.email}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.firma}</td>
							<td style="padding: 0.5rem 0.75rem;">{r.service}</td>
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap;">{r.amount}</td>
							<td style="padding: 0.5rem 0.75rem;">
								<span style="
									padding: 0.125rem 0.5rem;
									border-radius: 999px;
									font-size: 0.75rem;
									background: {r.method === 'rechnung' ? '#dbeafe' : r.method === 'bar' ? '#dcfce7' : '#f3e8ff'};
									color: {r.method === 'rechnung' ? '#1e40af' : r.method === 'bar' ? '#166534' : '#6b21a8'};
								">{r.method}</span>
							</td>
							<td style="padding: 0.5rem 0.75rem;">
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => { if (confirm(`${r.name} wirklich löschen?`)) (e.target as HTMLFormElement).submit(); }}
								>
									<input type="hidden" name="id" value={c.id} />
									<button type="submit" style="color: #dc2626; font-size: 0.75rem; background: none; border: none; cursor: pointer; padding: 0;">
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
</div>
