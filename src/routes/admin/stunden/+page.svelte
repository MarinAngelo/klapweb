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
	/** Billing time (ISO, UTC) in Swiss time */
	const fmtBilled = (iso: string) =>
		new Date(iso).toLocaleString('de-CH', {
			timeZone: 'Europe/Zurich',
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

	const sumMinutes = (list: Row[]) => list.reduce((sum, r) => sum + r.minutes, 0);
	const sumSpesen = (list: Row[]) => list.reduce((sum, r) => sum + (r.spesen || 0), 0);

	/**
	 * One section per person (alphabetical; entries without a name last):
	 * open entries + billings (newest first)
	 */
	$: groups = Object.values(
		rows.reduce<Record<string, { name: string; rows: Row[] }>>((acc, r) => {
			const name = (r.name ?? '').trim();
			(acc[name.toLowerCase()] ??= { name, rows: [] }).rows.push(r);
			return acc;
		}, {})
	)
		.map((g) => {
			const open = g.rows.filter((r) => !r.abrechnung);
			const billings = Object.values(
				g.rows
					.filter((r) => r.abrechnung)
					.reduce<Record<string, { id: string; at: string; rows: Row[] }>>((acc, r) => {
						const id = r.abrechnung as string;
						(acc[id] ??= { id, at: r.abgerechnetAm ?? '', rows: [] }).rows.push(r);
						return acc;
					}, {})
			).sort((a, b) => b.at.localeCompare(a.at));
			return { name: g.name, open, billings };
		})
		.sort((a, b) => (!a.name ? 1 : !b.name ? -1 : a.name.localeCompare(b.name, 'de')));

	function confirmBilling(ev: SubmitEvent, name: string, open: Row[]) {
		const text = $_('{anzahl} offene Einträge ({dauer}) von {name} jetzt abrechnen?')
			.replace('{anzahl}', String(open.length))
			.replace('{dauer}', fmtDuration(sumMinutes(open)))
			.replace('{name}', name || $_('Ohne Name'));
		if (!confirm(text)) ev.preventDefault();
	}
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
			'Einträge aus dem Formular «Stundenabrechnung». Offene Stunden pro Person mit «Abrechnen» als abgerechnet markieren; sie erscheinen danach unter «Abgerechnet».'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}
	{#if form?.error}
		<p class="admin-notice admin-notice-error">{$_(form.error)}</p>
	{/if}
	{#if form && 'billed' in form}
		<p class="admin-notice admin-notice-ok">
			✓ {$_('{anzahl} Einträge abgerechnet.').replace('{anzahl}', String(form.billed))}
		</p>
	{/if}

	{#if rows.length === 0}
		<section class="admin-card">
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		</section>
	{:else}
		<!-- Edit forms outside the tables: inputs in the rows refer to them via form="…" -->
		{#each rows as r (r.id)}
			{#if !r.abrechnung}
				<form id="edit-{r.id}" method="POST" action="?/update" hidden>
					<input type="hidden" name="id" value={r.id} />
				</form>
			{/if}
		{/each}

		{#each groups as group (group.name)}
			<section class="admin-card">
				<h2 class="admin-card-title">{group.name || $_('Ohne Name')}</h2>

				<!-- ── Open ─────────────────────────────────────────────────── -->
				<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
					<h3 class="m-0 text-base font-semibold">
						{$_('Offen')}
						<span class="admin-badge admin-badge-yellow">{group.open.length}</span>
					</h3>
					{#if group.open.length}
						<span class="admin-muted"
							>{fmtDuration(sumMinutes(group.open))} · {$_('Spesen')}
							{fmtChf(sumSpesen(group.open))}</span
						>
						<div class="ml-auto flex flex-wrap gap-2">
							<a
								href="/admin/stunden/stunden.csv?name={encodeURIComponent(group.name)}&status=offen"
								class="admin-btn admin-btn-sm"
								download>↓ {$_('CSV-Export')}</a
							>
							<form
								method="POST"
								action="?/abrechnen"
								on:submit={(ev) => confirmBilling(ev, group.name, group.open)}
							>
								<input type="hidden" name="name" value={group.name} />
								<button class="admin-btn admin-btn-dark admin-btn-sm"
									>{$_('Offene Stunden abrechnen')}</button
								>
							</form>
						</div>
					{/if}
				</div>

				{#if group.open.length === 0}
					<p class="admin-empty">{$_('Keine offenen Einträge.')}</p>
				{:else}
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
								{#each group.open as r (r.id)}
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
										<tr class:bg-yellow-50={form && 'saved' in form && form.saved === r.id}>
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
									<td class="nowrap text-right">{fmtDuration(sumMinutes(group.open))}</td>
									<td></td>
									<td class="nowrap text-right">{fmtChf(sumSpesen(group.open))}</td>
									<td></td>
								</tr>
							</tfoot>
						</table>
					</div>
				{/if}

				<!-- ── Billed: one block per billing (newest first) ───────────── -->
				{#if group.billings.length}
					<h3 class="mb-2 mt-6 text-base font-semibold">
						{$_('Abgerechnet')}
						<span class="admin-badge admin-badge-green">{group.billings.length}</span>
					</h3>
					<div class="flex flex-col gap-2">
						{#each group.billings as billing (billing.id)}
							<details class="rounded border border-gray-200">
								<summary
									class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2"
								>
									<span class="font-semibold">{$_('Abrechnung vom')} {fmtBilled(billing.at)}</span>
									<span class="admin-muted"
										>{billing.rows.length}
										{billing.rows.length === 1 ? $_('Eintrag') : $_('Einträge')} · {fmtDuration(
											sumMinutes(billing.rows)
										)} · {$_('Spesen')}
										{fmtChf(sumSpesen(billing.rows))}</span
									>
									<!-- CSV of this billing, visible without expanding -->
									<a
										href="/admin/stunden/stunden.csv?abrechnung={billing.id}"
										class="admin-btn admin-btn-sm ml-auto"
										download
										on:click|stopPropagation>↓ {$_('CSV-Export')}</a
									>
								</summary>
								<div class="border-t border-gray-200 px-3 py-3">
									<div class="mb-3 flex flex-wrap gap-2">
										<form
											method="POST"
											action="?/zuruecksetzen"
											on:submit={(ev) => {
												if (
													!confirm(
														$_('Abrechnung zurücksetzen? Die Einträge sind danach wieder offen.')
													)
												)
													ev.preventDefault();
											}}
										>
											<input type="hidden" name="abrechnung" value={billing.id} />
											<button class="admin-btn admin-btn-sm">{$_('Zurücksetzen')}</button>
										</form>
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
												</tr>
											</thead>
											<tbody>
												{#each billing.rows as r (r.id)}
													<tr>
														<td class="nowrap">{fmtDateTime(r.von)}</td>
														<td class="nowrap">{fmtBis(r.von, r.bis)}</td>
														<td class="whitespace-pre-wrap">{r.taetigkeit || '–'}</td>
														<td class="nowrap text-right">{fmtDuration(r.minutes)}</td>
														<td>{r.spesenText || '–'}</td>
														<td class="nowrap text-right">{r.spesen ? fmtChf(r.spesen) : '–'}</td>
													</tr>
												{/each}
											</tbody>
											<tfoot>
												<tr class="font-semibold">
													<td colspan="3">{$_('Total')}</td>
													<td class="nowrap text-right">{fmtDuration(sumMinutes(billing.rows))}</td>
													<td></td>
													<td class="nowrap text-right">{fmtChf(sumSpesen(billing.rows))}</td>
												</tr>
											</tfoot>
										</table>
									</div>
								</div>
							</details>
						{/each}
					</div>
				{/if}
			</section>
		{/each}
	{/if}
</div>
