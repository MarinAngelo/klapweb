<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import { ABZUG_FELDER, fmtChf, fmtStunden, monatName, type Saetze } from '$lib/assistenz';

	export let data: PageData;
	export let form: ActionData;

	/** Person in edit mode (id), null = none */
	let editing: string | null = null;
	// Close the edit row after saving
	$: if (form && 'saved' in form && form.saved === 'person') editing = null;

	/** Rate version in edit mode («gültig ab»), '' = new version, null = none */
	let editingSaetze: string | null = null;
	let entwurf: Saetze = { gueltigAb: '', tag: 0, nacht: 0, abzuege: [] };
	/** Percent per deduction field (key → input value) */
	let prozente: Record<string, string> = {};
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
			// Empty fields (not «0») when there is nothing to copy yet
			tag: vorlage?.tag ?? ('' as unknown as number),
			nacht: vorlage?.nacht ?? ('' as unknown as number),
			// First version: usual 8.33 % (4 weeks holiday); otherwise copied
			ferien: vorlage ? vorlage.ferien : 8.33,
			abzuege: []
		};
		// Fixed fields by name; deductions with other names (older versions) go into the first field
		const bekannt: readonly string[] = ABZUG_FELDER.map((f) => f.name);
		const runden = (n: number) => (n ? String(Math.round(n * 1000) / 1000) : '');
		const abzuege = vorlage?.abzuege ?? [];
		prozente = Object.fromEntries(
			ABZUG_FELDER.map((f, i) => [
				f.key,
				runden(
					abzuege
						.filter((a) => a.name === f.name || (i === 0 && !bekannt.includes(a.name)))
						.reduce((sum, a) => sum + a.prozent, 0)
				)
			])
		);
		editingSaetze = s?.gueltigAb ?? '';
	}

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
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
					<label>
						<span class="admin-label">{$_('Ferienentschädigung (%)')}</span>
						<input
							name="ferien"
							bind:value={entwurf.ferien}
							inputmode="decimal"
							placeholder="8.33"
							class="admin-input"
						/>
					</label>
				</div>
				<p class="admin-hint">
					{$_(
						'Ferienentschädigung: Zuschlag in Prozent auf Tag- und Nachtlohn, gehört zum Bruttolohn (8.33 % bei 4 Wochen Ferien). Leer = keine.'
					)}
				</p>

				<h3 class="mb-2 mt-4 text-sm font-semibold">{$_('Abzüge')}</h3>
				<div class="grid gap-3 sm:grid-cols-3">
					{#each ABZUG_FELDER as feld (feld.key)}
						<label>
							<span class="admin-label">{$_(feld.name)} (%)</span>
							<input
								name={feld.key}
								bind:value={prozente[feld.key]}
								inputmode="decimal"
								placeholder={feld.placeholder}
								class="admin-input"
							/>
						</label>
					{/each}
				</div>
				<p class="admin-hint">
					{$_(
						'Anteil der Assistenzperson in Prozent vom Bruttolohn, leer = kein Abzug. AHV/IV/EO und ALV: Sätze der Ausgleichskasse prüfen. Quellensteuer: im vereinfachten Abrechnungsverfahren der SVA 5 % für alle.'
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
							<th class="text-right">{$_('Ferienentschädigung')}</th>
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
								<td class="nowrap text-right">{s.ferien ? `${fmtStunden(s.ferien)} %` : '–'}</td>
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
