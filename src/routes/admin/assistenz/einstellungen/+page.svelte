<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import { fmtChf, fmtStunden, monatName, type Abzug, type Saetze } from '$lib/assistenz';

	export let data: PageData;
	export let form: ActionData;

	/** Person in edit mode (id), null = none */
	let editing: string | null = null;
	// Close the edit row after saving
	$: if (form && 'saved' in form && form.saved === 'person') editing = null;

	/** Rate version in edit mode («gültig ab»), '' = new version, null = none */
	let editingSaetze: string | null = null;
	let entwurf: Saetze = { gueltigAb: '', tag: 0, nacht: 0, abzuege: [] };
	$: if (form && 'saved' in form && form.saved === 'saetze') editingSaetze = null;

	$: saetzeNeuZuerst = [...data.config.saetze].sort((a, b) =>
		b.gueltigAb.localeCompare(a.gueltigAb)
	);

	const ANSTELLUNGEN = ['Fix', 'Springer', 'Springerin'];
	const monatsnamen = Array.from({ length: 12 }, (_, i) =>
		new Date(Date.UTC(2000, i, 1)).toLocaleString('de-CH', { month: 'long', timeZone: 'UTC' })
	);

	function bearbeiteSaetze(s: Saetze | null) {
		const vorlage = s ?? saetzeNeuZuerst[0];
		entwurf = {
			gueltigAb: s?.gueltigAb ?? '',
			tag: vorlage?.tag ?? 0,
			nacht: vorlage?.nacht ?? 0,
			// Copy, so «Abbrechen» leaves the list untouched; one empty row to start with
			abzuege: vorlage?.abzuege.length
				? vorlage.abzuege.map((a) => ({ ...a }))
				: [{ name: '', prozent: '' as unknown as number }]
		};
		editingSaetze = s?.gueltigAb ?? '';
	}

	const neueZeile = () =>
		(entwurf.abzuege = [...entwurf.abzuege, { name: '', prozent: '' as unknown as number }]);
	const entferneZeile = (a: Abzug) => (entwurf.abzuege = entwurf.abzuege.filter((x) => x !== a));

	const confirmSubmit = (text: string) => (ev: SubmitEvent) => {
		if (!confirm(text)) ev.preventDefault();
	};
</script>

<svelte:head><title>{$_('Assistenz')} · {$_('Personen & Sätze')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Personen & Sätze')} />
	<a href="/admin/assistenz" class="admin-link mb-4 inline-block">← {$_('Assistenz')}</a>

	{#if form?.error}
		<p class="admin-notice admin-notice-error">{$_(String(form.error))}</p>
	{:else if form && 'saved' in form}
		<p class="admin-notice admin-notice-ok">✓ {$_('Gespeichert')}</p>
	{/if}

	<!-- ── Persons ─────────────────────────────────────────────────────── -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Personen')}</h2>
		<p class="admin-intro">
			{$_(
				'Wer nicht mehr arbeitet: «Aktiv bis» setzen statt löschen — frühere Monate bleiben so vollständig. Löschen geht nur ohne erfasste Stunden.'
			)}
		</p>

		<datalist id="anstellungen">
			{#each ANSTELLUNGEN as a}<option value={a}></option>{/each}
		</datalist>

		{#each data.config.personen as p (p.id)}
			<form id="person-{p.id}" method="POST" action="?/updatePerson" hidden>
				<input type="hidden" name="id" value={p.id} />
			</form>
		{/each}
		<form id="person-neu" method="POST" action="?/addPerson" hidden></form>

		<div class="admin-table-wrap">
			<table class="admin-table">
				<thead>
					<tr>
						<th>{$_('Name')}</th>
						<th>{$_('Anstellung')}</th>
						<th>{$_('Aktiv ab')}</th>
						<th>{$_('Aktiv bis')}</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.config.personen as p, i (p.id)}
						{#if editing === p.id}
							<tr>
								<td>
									<input
										form="person-{p.id}"
										name="name"
										value={p.name}
										required
										class="admin-input"
										aria-label={$_('Name')}
									/>
								</td>
								<td>
									<input
										form="person-{p.id}"
										name="anstellung"
										value={p.anstellung}
										list="anstellungen"
										class="admin-input"
										aria-label={$_('Anstellung')}
									/>
								</td>
								<td>
									<input
										form="person-{p.id}"
										name="aktivAb"
										type="month"
										value={p.aktivAb ?? ''}
										placeholder="2026-09"
										pattern={'\\d{4}-\\d{2}'}
										class="admin-input"
										aria-label={$_('Aktiv ab')}
									/>
								</td>
								<td>
									<input
										form="person-{p.id}"
										name="aktivBis"
										type="month"
										value={p.aktivBis ?? ''}
										placeholder="2027-08"
										pattern={'\\d{4}-\\d{2}'}
										class="admin-input"
										aria-label={$_('Aktiv bis')}
									/>
								</td>
								<td class="nowrap">
									<button
										form="person-{p.id}"
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
							<tr class:bg-yellow-50={form && 'id' in form && form.id === p.id}>
								<td class="nowrap">{p.name}</td>
								<td>{p.anstellung || '–'}</td>
								<td class="nowrap">{p.aktivAb ? monatName(p.aktivAb) : '–'}</td>
								<td class="nowrap">{p.aktivBis ? monatName(p.aktivBis) : '–'}</td>
								<td class="nowrap">
									<form method="POST" action="?/movePerson" class="inline">
										<input type="hidden" name="id" value={p.id} />
										<button
											name="richtung"
											value="up"
											class="admin-btn admin-btn-sm"
											disabled={i === 0}
											aria-label={$_('Nach oben')}>↑</button
										>
										<button
											name="richtung"
											value="down"
											class="admin-btn admin-btn-sm"
											disabled={i === data.config.personen.length - 1}
											aria-label={$_('Nach unten')}>↓</button
										>
									</form>
									<button
										type="button"
										class="admin-btn admin-btn-sm"
										on:click={() => (editing = p.id)}>{$_('Bearbeiten')}</button
									>
									<form
										method="POST"
										action="?/deletePerson"
										class="inline"
										on:submit={confirmSubmit($_('Diese Person löschen?'))}
									>
										<input type="hidden" name="id" value={p.id} />
										<button class="admin-btn admin-btn-danger admin-btn-sm">{$_('Löschen')}</button>
									</form>
								</td>
							</tr>
						{/if}
					{/each}
					<!-- New person -->
					<tr>
						<td>
							<input
								form="person-neu"
								name="name"
								required
								placeholder={$_('Name')}
								class="admin-input"
								aria-label={$_('Name')}
							/>
						</td>
						<td>
							<input
								form="person-neu"
								name="anstellung"
								list="anstellungen"
								placeholder="Fix"
								class="admin-input"
								aria-label={$_('Anstellung')}
							/>
						</td>
						<td>
							<input
								form="person-neu"
								name="aktivAb"
								type="month"
								placeholder="2026-09"
								pattern={'\\d{4}-\\d{2}'}
								class="admin-input"
								aria-label={$_('Aktiv ab')}
							/>
						</td>
						<td>
							<input
								form="person-neu"
								name="aktivBis"
								type="month"
								placeholder="2027-08"
								pattern={'\\d{4}-\\d{2}'}
								class="admin-input"
								aria-label={$_('Aktiv bis')}
							/>
						</td>
						<td class="nowrap">
							<button form="person-neu" type="submit" class="admin-btn admin-btn-dark admin-btn-sm"
								>+ {$_('Person hinzufügen')}</button
							>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="admin-hint">{$_('«Aktiv ab» und «Aktiv bis» leer lassen = unbefristet.')}</p>
	</section>

	<!-- ── Rates and deductions ───────────────────────────────────────── -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Stundensätze und Abzüge')}</h2>
		<p class="admin-intro">
			{$_(
				'Gelten ab dem gewählten Monat bis zur nächsten Änderung. Bei einer Erhöhung neue Sätze mit «Gültig ab» erfassen — frühere Monate bleiben unverändert. Abzüge in Prozent vom Bruttolohn.'
			)}
		</p>

		{#if editingSaetze === null}
			<button
				type="button"
				class="admin-btn admin-btn-dark mb-4"
				on:click={() => bearbeiteSaetze(null)}>+ {$_('Neue Sätze ab Monat')}</button
			>
		{/if}

		{#if editingSaetze !== null}
			<form method="POST" action="?/saveSaetze" class="admin-fieldset">
				<input type="hidden" name="original" value={editingSaetze} />
				<div class="grid gap-3 sm:grid-cols-3">
					<label>
						<span class="admin-label">{$_('Gültig ab')}</span>
						<input
							name="gueltigAb"
							type="month"
							bind:value={entwurf.gueltigAb}
							required
							placeholder="2026-09"
							pattern={'\\d{4}-\\d{2}'}
							class="admin-input"
						/>
					</label>
					<label>
						<span class="admin-label">{$_('Tag CHF / Stunde')}</span>
						<input
							name="tag"
							bind:value={entwurf.tag}
							required
							inputmode="decimal"
							class="admin-input"
						/>
					</label>
					<label>
						<span class="admin-label">{$_('Nacht CHF / Stunde')}</span>
						<input
							name="nacht"
							bind:value={entwurf.nacht}
							required
							inputmode="decimal"
							class="admin-input"
						/>
					</label>
				</div>

				<h3 class="mb-2 mt-4 text-sm font-semibold">{$_('Abzüge')}</h3>
				<div class="flex flex-col gap-2">
					{#each entwurf.abzuege as a}
						<div class="flex flex-wrap items-center gap-2">
							<input
								name="abzug_name"
								bind:value={a.name}
								placeholder={$_('z.B. AHV/IV/EO')}
								class="admin-input w-56"
								aria-label={$_('Bezeichnung')}
							/>
							<input
								name="abzug_prozent"
								bind:value={a.prozent}
								inputmode="decimal"
								placeholder="5.3"
								class="admin-input w-24 text-right"
								aria-label={$_('Prozent')}
							/>
							<span>%</span>
							<button
								type="button"
								class="admin-btn admin-btn-sm"
								on:click={() => entferneZeile(a)}
								aria-label={$_('Entfernen')}>✕</button
							>
						</div>
					{/each}
				</div>
				<button type="button" class="admin-btn admin-btn-sm mt-2" on:click={neueZeile}
					>+ {$_('Abzug')}</button
				>
				<p class="admin-hint">
					{$_(
						'Die Prozentsätze der Sozialversicherungen bitte bei der Ausgleichskasse bzw. Versicherung prüfen.'
					)}
				</p>

				<div class="mt-4 flex gap-2">
					<button type="submit" class="admin-btn admin-btn-dark">{$_('Speichern')}</button>
					<button type="button" class="admin-btn" on:click={() => (editingSaetze = null)}
						>{$_('Abbrechen')}</button
					>
				</div>
			</form>
		{/if}

		{#if saetzeNeuZuerst.length === 0}
			<p class="admin-empty">{$_('Noch keine Stundensätze erfasst.')}</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Gültig ab')}</th>
							<th class="text-right">{$_('Tag CHF / Stunde')}</th>
							<th class="text-right">{$_('Nacht CHF / Stunde')}</th>
							<th>{$_('Abzüge')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each saetzeNeuZuerst as s (s.gueltigAb)}
							<tr>
								<td class="nowrap">{monatName(s.gueltigAb)}</td>
								<td class="nowrap text-right">{fmtChf(s.tag)}</td>
								<td class="nowrap text-right">{fmtChf(s.nacht)}</td>
								<td>
									{#if s.abzuege.length}
										{s.abzuege.map((a) => `${a.name} ${fmtStunden(a.prozent)} %`).join(' · ')}
									{:else}–{/if}
								</td>
								<td class="nowrap">
									<button
										type="button"
										class="admin-btn admin-btn-sm"
										on:click={() => bearbeiteSaetze(s)}>{$_('Bearbeiten')}</button
									>
									<form
										method="POST"
										action="?/deleteSaetze"
										class="inline"
										on:submit={confirmSubmit(
											$_(
												'Diese Sätze löschen? Betroffene Monate rechnen danach mit den vorherigen Sätzen.'
											)
										)}
									>
										<input type="hidden" name="gueltigAb" value={s.gueltigAb} />
										<button class="admin-btn admin-btn-danger admin-btn-sm">{$_('Löschen')}</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- ── Start of the assistance year ───────────────────────────────── -->
	<section class="admin-card">
		<h2 class="admin-card-title">{$_('Assistenzjahr')}</h2>
		<form method="POST" action="?/jahresbeginn" class="flex flex-wrap items-end gap-3">
			<label>
				<span class="admin-label">{$_('Jahr beginnt im')}</span>
				<select name="jahresbeginn" class="admin-input" value={data.config.jahresbeginn}>
					{#each monatsnamen as name, i}
						<option value={i + 1}>{name}</option>
					{/each}
				</select>
			</label>
			<button type="submit" class="admin-btn admin-btn-dark">{$_('Speichern')}</button>
		</form>
	</section>
</div>
