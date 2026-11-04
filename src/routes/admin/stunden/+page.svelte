<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';

	export let data: PageData;
	export let form: ActionData;

	/** Entry in edit mode (id), null = none */
	let editing: string | null = null;

	const minutesOf = (von: string, bis: string) =>
		Math.max(0, Math.round((Date.parse(`${bis}:00Z`) - Date.parse(`${von}:00Z`)) / 60000));
	const fmtDuration = (min: number) =>
		`${Math.floor(min / 60)} ${$_('Std.')} ${String(min % 60).padStart(2, '0')} ${$_('Min.')}`;
	const fmtDateTime = (v: string) =>
		new Date(`${v}:00Z`).toLocaleString('de-CH', {
			timeZone: 'UTC',
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	/** Only the time if «Bis» is on the same day as «Von» */
	const fmtBis = (von: string, bis: string) =>
		bis.slice(0, 10) === von.slice(0, 10) ? bis.slice(11) : fmtDateTime(bis);
	const fmtChf = (n: number) =>
		new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
			n
		);

	$: rows = data.entries.map((e) => ({ ...e, minutes: minutesOf(e.von, e.bis) }));
	$: totalMinutes = rows.reduce((sum, r) => sum + r.minutes, 0);
	$: totalSpesen = rows.reduce((sum, r) => sum + (r.spesen || 0), 0);
</script>

<svelte:head><title>{$_('Stunden')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Stunden')} count={data.entries.length}>
		{#if data.entries.length}
			<a href="/admin/stunden/stunden.csv" class="admin-btn" download>↓ {$_('CSV-Export')}</a>
		{/if}
	</AdminHeader>

	<p class="admin-intro">
		{$_(
			'Einträge aus dem Formular «Stundenabrechnung». Erfassen auf der passwortgeschützten Seite mit diesem Formular.'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}
	{#if form?.error}
		<p class="admin-notice admin-notice-error">{$_(form.error)}</p>
	{/if}

	<section class="admin-card">
		{#if rows.length === 0}
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		{:else}
			<!-- Edit forms outside the table: inputs in the rows refer to them via form="…" -->
			{#each rows as r (r.id)}
				<form id="edit-{r.id}" method="POST" action="?/update" hidden>
					<input type="hidden" name="id" value={r.id} />
				</form>
			{/each}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Name')}</th>
							<th>{$_('Von')}</th>
							<th>{$_('Bis')}</th>
							<th>{$_('Projekt / Kunde')}</th>
							<th>{$_('Tätigkeit')}</th>
							<th class="text-right">{$_('Dauer')}</th>
							<th>{$_('Spesen-Beschreibung')}</th>
							<th class="text-right">{$_('Spesen (CHF)')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each rows as r (r.id)}
							{#if editing === r.id}
								<tr>
									<td>
										<input
											form="edit-{r.id}"
											name="name"
											value={r.name ?? ''}
											required
											class="admin-input"
										/>
									</td>
									<td>
										<input
											form="edit-{r.id}"
											name="von"
											type="datetime-local"
											value={r.von}
											required
											class="admin-input"
										/>
									</td>
									<td>
										<input
											form="edit-{r.id}"
											name="bis"
											type="datetime-local"
											value={r.bis}
											required
											class="admin-input"
										/>
									</td>
									<td>
										<input
											form="edit-{r.id}"
											name="projekt"
											value={r.projekt}
											class="admin-input"
										/>
									</td>
									<td>
										<input
											form="edit-{r.id}"
											name="taetigkeit"
											value={r.taetigkeit}
											class="admin-input"
										/>
									</td>
									<td></td>
									<td>
										<input
											form="edit-{r.id}"
											name="spesenText"
											value={r.spesenText ?? ''}
											class="admin-input"
										/>
									</td>
									<td>
										<input
											form="edit-{r.id}"
											name="spesen"
											type="number"
											min="0"
											step="0.05"
											value={r.spesen || ''}
											class="admin-input w-24 text-right"
										/>
									</td>
									<td class="nowrap">
										<button
											form="edit-{r.id}"
											type="submit"
											class="admin-btn admin-btn-dark admin-btn-sm">{$_('Speichern')}</button
										>
										<button
											type="button"
											class="admin-btn admin-btn-sm"
											on:click={() => (editing = null)}>{$_('Abbrechen')}</button
										>
									</td>
								</tr>
							{:else}
								<tr class:bg-yellow-50={form?.saved === r.id}>
									<td>{r.name || '–'}</td>
									<td class="nowrap">{fmtDateTime(r.von)}</td>
									<td class="nowrap">{fmtBis(r.von, r.bis)}</td>
									<td>{r.projekt || '–'}</td>
									<td class="whitespace-pre-wrap">{r.taetigkeit || '–'}</td>
									<td class="nowrap text-right">{fmtDuration(r.minutes)}</td>
									<td>{r.spesenText || '–'}</td>
									<td class="nowrap text-right">{r.spesen ? fmtChf(r.spesen) : '–'}</td>
									<td class="nowrap">
										<button
											type="button"
											class="admin-btn admin-btn-sm"
											on:click={() => (editing = r.id)}>{$_('Bearbeiten')}</button
										>
										<form
											method="POST"
											action="?/delete"
											class="inline"
											on:submit={(ev) => {
												if (!confirm($_('Diesen Eintrag endgültig löschen?'))) ev.preventDefault();
											}}
										>
											<input type="hidden" name="id" value={r.id} />
											<button class="admin-btn admin-btn-danger admin-btn-sm"
												>{$_('Löschen')}</button
											>
										</form>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
					<tfoot>
						<tr class="font-semibold">
							<td colspan="5">{$_('Total')}</td>
							<td class="nowrap text-right">{fmtDuration(totalMinutes)}</td>
							<td></td>
							<td class="nowrap text-right">{fmtChf(totalSpesen)}</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</section>
</div>
