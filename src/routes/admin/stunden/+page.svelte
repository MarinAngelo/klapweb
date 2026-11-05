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
	type Row = (typeof rows)[number];

	/** One table per person (alphabetical; entries without a name last) */
	$: groups = Object.values(
		rows.reduce<Record<string, { name: string; rows: Row[] }>>((acc, r) => {
			const name = (r.name ?? '').trim();
			(acc[name.toLowerCase()] ??= { name, rows: [] }).rows.push(r);
			return acc;
		}, {})
	)
		.map((g) => ({
			...g,
			minutes: g.rows.reduce((sum, r) => sum + r.minutes, 0),
			spesen: g.rows.reduce((sum, r) => sum + (r.spesen || 0), 0)
		}))
		.sort((a, b) => (!a.name ? 1 : !b.name ? -1 : a.name.localeCompare(b.name, 'de')));
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

	{#if rows.length === 0}
		<section class="admin-card">
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		</section>
	{:else}
		<!-- Edit forms outside the tables: inputs in the rows refer to them via form="…" -->
		{#each rows as r (r.id)}
			<form id="edit-{r.id}" method="POST" action="?/update" hidden>
				<input type="hidden" name="id" value={r.id} />
			</form>
		{/each}

		{#each groups as group (group.name)}
			<section class="admin-card">
				<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
					<h2 class="admin-card-title m-0">{group.name || $_('Ohne Name')}</h2>
					<span class="admin-muted"
						>{fmtDuration(group.minutes)} · {$_('Spesen')} {fmtChf(group.spesen)}</span
					>
					<a
						href="/admin/stunden/stunden.csv?name={encodeURIComponent(group.name)}"
						class="admin-btn admin-btn-sm ml-auto"
						download>↓ {$_('CSV-Export')}</a
					>
				</div>
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>{$_('Von')}</th>
								<th>{$_('Bis')}</th>
								<th>{$_('Tätigkeit')}</th>
								<th class="text-right">{$_('Dauer')}</th>
								<th>{$_('Spesen-Beschreibung')}</th>
								<th class="text-right">{$_('Spesen (CHF)')}</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each group.rows as r (r.id)}
								{#if editing === r.id}
									<tr>
										<td>
											<input
												form="edit-{r.id}"
												name="name"
												value={r.name ?? ''}
												required
												placeholder={$_('Name')}
												aria-label={$_('Name')}
												class="admin-input mb-1"
											/>
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
										<td class="nowrap">{fmtDateTime(r.von)}</td>
										<td class="nowrap">{fmtBis(r.von, r.bis)}</td>
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
													if (!confirm($_('Diesen Eintrag endgültig löschen?')))
														ev.preventDefault();
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
								<td colspan="3">{$_('Total')}</td>
								<td class="nowrap text-right">{fmtDuration(group.minutes)}</td>
								<td></td>
								<td class="nowrap text-right">{fmtChf(group.spesen)}</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</section>
		{/each}
	{/if}
</div>
