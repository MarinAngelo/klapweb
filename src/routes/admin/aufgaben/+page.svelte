<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { enhance } from '$app/forms';
	import { formatDateTimeShort } from '$lib/utils/formatDate';
	export let data: PageData;

	const statusLabels: Record<string, string> = {
		angenommen: 'Angenommen',
		annahme_bestaetigt: 'Bestätigt',
		abgegeben: 'Abgegeben',
		erledigt: 'Erledigt'
	};

	const statusBadge: Record<string, string> = {
		angenommen: 'admin-badge-yellow',
		annahme_bestaetigt: 'admin-badge-blue',
		abgegeben: 'admin-badge-purple',
		erledigt: 'admin-badge-green'
	};

	const prioBadge: Record<string, string> = {
		Hoch: 'admin-badge-red',
		Mittel: '',
		Gering: 'admin-badge-green'
	};

	const fmtDate = (iso: string | undefined) => (iso ? formatDateTimeShort(iso) : '–');

	// Group by aufgabeUid; subtasks appear as "Main task › Subtask", sorted so they stay together
	const groupTitle = (a: PageData['annahmen'][number]) =>
		a.hauptaufgabeTitel ? `${a.hauptaufgabeTitel} › ${a.aufgabeTitel}` : a.aufgabeTitel;

	$: grouped = Object.entries(
		data.annahmen.reduce<Record<string, typeof data.annahmen>>((acc, a) => {
			(acc[a.bonus ? `bonus:${a.aufgabeUid}` : a.aufgabeUid] ??= []).push(a);
			return acc;
		}, {})
	).sort(([, a], [, b]) => groupTitle(a[0]).localeCompare(groupTitle(b[0])));

	let erledigtMinuten: Record<string, string> = {};

	function confirmLoeschen(e: SubmitEvent, name: string) {
		if (!confirm(`Annahme von ${name} wirklich löschen?`)) e.preventDefault();
	}
</script>

<svelte:head><title>Aufgaben-Annahmen</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="Aufgaben-Annahmen" count={data.annahmen.length}>
		<form
			method="POST"
			action="?/deleteAll"
			on:submit={(e) => {
				if (!confirm('Alle Aufgaben löschen?')) e.preventDefault();
			}}
		>
			<button type="submit" class="admin-btn admin-btn-danger-outline">Alle löschen</button>
		</form>
	</AdminHeader>

	{#if data.blobError}
		<p class="admin-notice admin-notice-error admin-mono">Fehler: {data.blobError}</p>
	{/if}

	{#if data.annahmen.length === 0}
		<p class="admin-empty">Noch keine Annahmen vorhanden.</p>
	{:else}
		{#each grouped as [aufgabeUid, annahmen]}
			{@const prio = !annahmen[0]?.bonus ? data.prioritaeten[annahmen[0]?.aufgabeUid] : undefined}
			<section class="admin-card">
				<h2 class="admin-card-title">
					{groupTitle(annahmen[0]) || aufgabeUid}
					{#if prio}
						<span class="admin-badge {prioBadge[prio] ?? ''}">Priorität: {prio}</span>
					{/if}
					<span class="admin-count">({annahmen.length})</span>
				</h2>
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								{#each ['Status', 'Name', 'E-Mail', 'Buchung', 'Credit-Typ', 'Credits', 'Minuten', 'Kommentar', 'Angenommen am', 'Erledigt am', 'Aktionen'] as col}
									<th>{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each annahmen as a}
								<tr>
									<td class="nowrap">
										<span class="admin-badge {statusBadge[a.status] ?? ''}">
											{statusLabels[a.status] ?? a.status}
										</span>
									</td>
									<td class="nowrap">{a.name}</td>
									<td class="nowrap">{a.email}</td>
									<td class="text-xs">
										<span class="admin-muted">Buchungs-ID:</span><br />
										<span class="admin-mono select-all">{a.buchungId}</span>
									</td>
									<td class="nowrap"
										>{a.bonus ? 'Bonus' : a.creditTyp === 'fest' ? 'Fest' : 'Zeitbasiert'}</td
									>
									<td class="nowrap"
										>{a.credits != null
											? a.credits
											: a.creditBetrag != null
												? a.creditBetrag
												: '–'}</td
									>
									<td class="nowrap">{a.minuten != null ? `${a.minuten} min` : '–'}</td>
									<td class="max-w-[200px] text-xs">{a.kommentar ?? '–'}</td>
									<td class="nowrap">{fmtDate(a.angenommenAt)}</td>
									<td class="nowrap">{fmtDate(a.erledigtAt)}</td>
									<td>
										<div class="flex min-w-[220px] flex-col gap-1.5">
											{#if a.status === 'angenommen'}
												<form method="POST" action="?/bestaetigen" use:enhance>
													<input type="hidden" name="id" value={a.id} />
													<button
														type="submit"
														class="admin-btn admin-btn-primary admin-btn-sm admin-btn-block"
													>
														Annahme bestätigen
													</button>
												</form>
											{/if}
											{#if a.status === 'abgegeben'}
												<form
													method="POST"
													action="?/freigeben"
													use:enhance
													class="flex flex-col gap-1"
												>
													<input type="hidden" name="id" value={a.id} />
													<label for="credits-{a.id}" class="admin-hint mt-0"
														>Credits (anpassen)</label
													>
													<input
														id="credits-{a.id}"
														type="number"
														name="credits"
														step="0.01"
														value={0}
														class="admin-input admin-input-sm"
													/>
													<textarea
														name="betreiber_antwort"
														rows="3"
														placeholder="Antwort an Mieter (optional)"
														class="admin-input admin-input-sm resize-y"
													></textarea>
													<button
														type="submit"
														class="admin-btn admin-btn-success admin-btn-sm admin-btn-block"
													>
														✓ Freigeben &amp; Erledigt
													</button>
												</form>
											{/if}
											{#if !['abgegeben', 'erledigt'].includes(a.status)}
												<form
													method="POST"
													action="?/erledigt"
													use:enhance
													class="flex flex-col gap-1"
												>
													<input type="hidden" name="id" value={a.id} />
													{#if a.creditTyp === 'offen'}
														<input
															type="number"
															name="minuten"
															min="1"
															placeholder="Minuten"
															bind:value={erledigtMinuten[a.id]}
															class="admin-input admin-input-sm"
														/>
													{/if}
													<button
														type="submit"
														class="admin-btn admin-btn-success admin-btn-sm admin-btn-block"
													>
														Als erledigt markieren
													</button>
												</form>
											{/if}
											{#if a.status !== 'angenommen' && !a.bonus}
												<form method="POST" action="?/zuruecksetzen" use:enhance>
													<input type="hidden" name="id" value={a.id} />
													<button type="submit" class="admin-btn admin-btn-sm admin-btn-block">
														↺ Zurücksetzen
													</button>
												</form>
											{/if}
											<form
												method="POST"
												action="?/loeschen"
												use:enhance
												on:submit={(e) => confirmLoeschen(e, a.name)}
											>
												<input type="hidden" name="id" value={a.id} />
												<button
													type="submit"
													class="admin-btn admin-btn-danger-outline admin-btn-sm admin-btn-block"
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
			</section>
		{/each}
	{/if}
</div>
