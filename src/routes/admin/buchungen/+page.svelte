<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import { page } from '$app/stores';

	$: secret = $page.url.searchParams.get('secret') ?? '';

	function confirmDelete(e: SubmitEvent, titel: string) {
		if (!confirm(`Buchung "${titel}" wirklich löschen (Termin wird wieder frei)?`)) return;
		(e.currentTarget as HTMLFormElement).submit();
	}

	function fmtDate(datum: string, uhrzeit: string) {
		if (!datum) return '–';
		const d = new Date(datum + 'T12:00:00Z');
		const formatted = d.toLocaleDateString('de-CH', {
			weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
		});
		return uhrzeit ? `${formatted}, ${uhrzeit}` : formatted;
	}
</script>

<svelte:head><title>Buchungen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1000px; margin: 0 auto;">
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 1.5rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold;">
			Buchungen ({data.bookings.length})
		</h1>
		<a href="/admin/kunden?secret={secret}" style="font-size: 0.875rem; color: #6b7280;">→ Kunden</a>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem;">Fehler: {data.blobError}</p>
	{/if}

	{#if data.bookings.length === 0}
		<p style="opacity: 0.5;">Noch keine Buchungen.</p>
	{:else}
		<div style="overflow-x: auto;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each ['Termin', 'Titel', 'Name', 'E-Mail', 'Gebucht am', ''] as col}
							<th style="padding: 0.5rem 0.75rem; white-space: nowrap;">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as b}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap;">{fmtDate(b.datum, b.uhrzeit)}</td>
							<td style="padding: 0.5rem 0.75rem;">{b.titel || b.terminId}</td>
							<td style="padding: 0.5rem 0.75rem;">{b.name ?? '–'}</td>
							<td style="padding: 0.5rem 0.75rem;">{b.email ?? '–'}</td>
							<td style="padding: 0.5rem 0.75rem; white-space: nowrap; opacity: 0.6;">
								{new Date(b.bookedAt).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
							</td>
							<td style="padding: 0.5rem 0.75rem;">
								<form
									method="POST"
									action="?/delete&secret={secret}"
									on:submit|preventDefault={(e) => confirmDelete(e, b.titel || b.terminId)}
								>
									<input type="hidden" name="id" value={b.terminId} />
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
