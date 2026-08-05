<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { formatDateTimeShort } from '$lib/utils/formatDate';
	export let data: PageData;

	$: secret = data.secret ?? '';

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		eingereicht: 'In Bearbeitung',
		erledigt: 'Erledigt'
	};

	const statusColors: Record<string, string> = {
		angenommen: '#fef3c7',
		annahme_bestaetigt: '#dbeafe',
		eingereicht: '#ede9fe',
		erledigt: '#dcfce7'
	};

	const fmtDate = (iso: string | undefined) => (iso ? formatDateTimeShort(iso) : '–');

	// Group by aufgabeUid
	$: grouped = data.annahmen.reduce<Record<string, typeof data.annahmen>>((acc, a) => {
		(acc[a.aufgabeUid] ??= []).push(a);
		return acc;
	}, {});

	const tdStyle = 'padding: 0.5rem 0.75rem; vertical-align: top;';
	const tdNowrap = tdStyle + ' white-space: nowrap;';

	let erledigtMinuten: Record<string, string> = {};

	function confirmLoeschen(e: SubmitEvent, name: string) {
		if (!confirm(`Annahme von ${name} wirklich löschen?`)) e.preventDefault();
	}
</script>

<svelte:head><title>Aufgaben-Annahmen</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto;">
	<div style="display: flex; align-items: baseline; gap: 2rem; margin-bottom: 2rem;">
		<a href="/admin/dashboard?secret={secret}" style="font-size: 0.875rem; color: #6b7280;"
			>← Dashboard</a
		>
		<h1 style="font-size: 1.5rem; font-weight: bold;">Aufgaben-Annahmen</h1>
		<span style="font-size: 0.875rem; color: #6b7280;">{data.annahmen.length} Einträge</span>
	</div>

	{#if data.blobError}
		<p style="color: red; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">
			Fehler: {data.blobError}
		</p>
	{/if}

	{#if data.annahmen.length === 0}
		<p style="opacity: 0.5;">Noch keine Annahmen vorhanden.</p>
	{:else}
		{#each Object.entries(grouped) as [aufgabeUid, annahmen]}
			<h2
				style="font-size: 1.1rem; font-weight: 600; margin: 2rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb;"
			>
				{annahmen[0]?.aufgabeTitel || aufgabeUid}
				<span style="font-weight: 400; opacity: 0.5; font-size: 0.875rem;">({annahmen.length})</span
				>
			</h2>
			<div style="overflow-x: auto;">
				<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
					<thead>
						<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
							{#each ['Status', 'Name', 'E-Mail', 'Buchung', 'Credit-Typ', 'Credits', 'Minuten', 'Kommentar', 'Angenommen am', 'Erledigt am', 'Aktionen'] as col}
								<th style="padding: 0.5rem 0.75rem; font-weight: 600; white-space: nowrap;"
									>{col}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each annahmen as a}
							<tr style="border-bottom: 1px solid #f3f4f6;">
								<td style={tdNowrap}>
									<span
										style="padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; background: {statusColors[
											a.status
										] ?? '#f3f4f6'};"
									>
										{statusLabels[a.status] ?? a.status}
									</span>
								</td>
								<td style={tdNowrap}>{a.name}</td>
								<td style={tdNowrap}>{a.email}</td>
								<td style="padding: 0.5rem 0.75rem; font-size: 0.75rem;">
									<span style="opacity: 0.5;">Buchungs-ID:</span><br />
									<span style="font-family: monospace; word-break: break-all; user-select: all;"
										>{a.buchungId}</span
									>
								</td>
								<td style={tdNowrap}>{a.creditTyp === 'fest' ? 'Fest' : 'Zeitbasiert'}</td>
								<td style={tdNowrap}
									>{a.credits != null
										? a.credits
										: a.creditBetrag != null
											? a.creditBetrag
											: '–'}</td
								>
								<td style={tdNowrap}>{a.minuten != null ? `${a.minuten} min` : '–'}</td>
								<td
									style="padding: 0.5rem 0.75rem; max-width: 200px; font-size: 0.75rem; opacity: 0.8;"
									>{a.kommentar ?? '–'}</td
								>
								<td style={tdNowrap}>{fmtDate(a.angenommenAt)}</td>
								<td style={tdNowrap}>{fmtDate(a.erledigtAt)}</td>
								<td style={tdStyle}>
									<div
										style="display: flex; flex-direction: column; gap: 0.375rem; min-width: 220px;"
									>
										{#if a.status === 'angenommen'}
											<form method="POST" action="?/bestaetigen&secret={secret}" use:enhance>
												<input type="hidden" name="id" value={a.id} />
												<button
													type="submit"
													style="width: 100%; padding: 0.25rem 0.75rem; background: #2563eb; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;"
												>
													Annahme bestätigen
												</button>
											</form>
										{/if}
										{#if a.status === 'eingereicht'}
											<form
												method="POST"
												action="?/freigeben&secret={secret}"
												use:enhance
												style="display: flex; flex-direction: column; gap: 0.25rem;"
											>
												<input type="hidden" name="id" value={a.id} />
												<label for="credits-{a.id}" style="font-size: 0.7rem; color: #6b7280;"
													>Credits (anpassen)</label
												>
												<input
													id="credits-{a.id}"
													type="number"
													name="credits"
													step="0.01"
													value={0}
													style="padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.75rem; width: 100%;"
												/>
												<textarea
													name="betreiber_antwort"
													rows="3"
													placeholder="Antwort an Mieter (optional)"
													style="padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.75rem; width: 100%; resize: vertical;"
												></textarea>
												<button
													type="submit"
													style="width: 100%; padding: 0.25rem 0.75rem; background: #16a34a; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;"
												>
													✓ Freigeben &amp; Erledigt
												</button>
											</form>
										{/if}
										{#if !['eingereicht', 'erledigt'].includes(a.status)}
											<form
												method="POST"
												action="?/erledigt&secret={secret}"
												use:enhance
												style="display: flex; flex-direction: column; gap: 0.25rem;"
											>
												<input type="hidden" name="id" value={a.id} />
												{#if a.creditTyp === 'offen'}
													<input
														type="number"
														name="minuten"
														min="1"
														placeholder="Minuten"
														bind:value={erledigtMinuten[a.id]}
														style="padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; font-size: 0.75rem; width: 100%;"
													/>
												{/if}
												<button
													type="submit"
													style="width: 100%; padding: 0.25rem 0.75rem; background: #16a34a; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;"
												>
													Als erledigt markieren
												</button>
											</form>
										{/if}
										{#if a.status !== 'angenommen'}
											<form method="POST" action="?/zuruecksetzen&secret={secret}" use:enhance>
												<input type="hidden" name="id" value={a.id} />
												<button
													type="submit"
													style="width: 100%; padding: 0.25rem 0.75rem; background: #6b7280; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;"
												>
													↺ Zurücksetzen
												</button>
											</form>
										{/if}
										<form
											method="POST"
											action="?/loeschen&secret={secret}"
											use:enhance
											on:submit={(e) => confirmLoeschen(e, a.name)}
										>
											<input type="hidden" name="id" value={a.id} />
											<button
												type="submit"
												style="width: 100%; padding: 0.25rem 0.75rem; background: #dc2626; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;"
											>
												Löschen
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	{/if}
</div>
