<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import { fmtChf, fmtStunden, jahrVonMonat, monatName } from '$lib/assistenz';

	export let data: PageData;
	export let form: ActionData;

	let laeuft = false;

	/** Keep the chosen file after «Prüfen», so «Importieren» needs no second selection */
	const senden: SubmitFunction = ({ submitter, cancel }) => {
		if (
			submitter?.getAttribute('value') === 'importieren' &&
			!confirm($_('Jetzt importieren? Personen, Sätze und Stunden werden gespeichert.'))
		) {
			cancel();
			return;
		}
		laeuft = true;
		return async ({ update }) => {
			await update({ reset: false });
			laeuft = false;
		};
	};

	const STATUS: Record<string, { label: string; badge: string }> = {
		neu: { label: 'Neu', badge: 'admin-badge-green' },
		ueberschrieben: { label: 'Überschrieben', badge: 'admin-badge-orange' },
		vorhanden: { label: 'Schon erfasst — übersprungen', badge: 'admin-badge-yellow' },
		leer: { label: 'Keine Stunden', badge: 'admin-badge-blue' }
	};

	const hinweisText = (h: { key: string; params?: Record<string, string> }) =>
		Object.entries(h.params ?? {}).reduce(
			(text, [k, v]) => text.replace(`{${k}}`, k === 'monat' ? monatName(v) : v),
			$_(h.key)
		);

	$: bericht = form && 'bericht' in form ? form.bericht : null;
	$: mitStunden = bericht?.monate.filter((m) => m.status !== 'leer') ?? [];
	$: ersterMonat = mitStunden[0]?.monat;
</script>

<svelte:head><title>{$_('Assistenz')} · {$_('Import')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Import')} />
	<a href="/admin/assistenz" class="admin-link mb-4 inline-block">← {$_('Assistenz')}</a>

	<p class="admin-intro">
		{$_(
			'Bisherige Tabelle übernehmen, damit nichts doppelt erfasst werden muss. Erkannt werden Blöcke mit Monatstitel (z.B. «September 2026») und der Kopfzeile «Person · Anstellung · Tagstunden · Nachtstunden» — wie in der bisherigen Monatsübersicht und im CSV-Export dieser Seite.'
		)}
	</p>

	<section class="admin-card">
		<form method="POST" enctype="multipart/form-data" use:enhance={senden}>
			<label class="block">
				<span class="admin-label">{$_('Datei')}</span>
				<input name="datei" type="file" accept=".ods,.csv,.txt" required class="admin-input" />
			</label>
			<p class="admin-hint">
				{$_('LibreOffice (.ods) oder CSV. Excel-Dateien zuerst als CSV speichern.')}
			</p>
			<label class="mt-3 flex items-center gap-2">
				<input name="ueberschreiben" type="checkbox" class="admin-checkbox" />
				<span>{$_('Monate mit bereits erfassten Stunden überschreiben')}</span>
			</label>
			<p class="admin-hint">
				{$_(
					'Ohne Haken bleiben Monate, in denen schon Stunden erfasst sind, unverändert. Personen werden am Namen erkannt, neue angelegt. Stundensätze aus der Datei werden nur übernommen, wenn noch keine erfasst sind.'
				)}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<button name="modus" value="pruefen" class="admin-btn" disabled={laeuft}
					>{$_('Prüfen')}</button
				>
				<button name="modus" value="importieren" class="admin-btn admin-btn-dark" disabled={laeuft}
					>{$_('Importieren')}</button
				>
			</div>
		</form>
	</section>

	{#if form && 'error' in form && form.error}
		<p class="admin-notice admin-notice-error">{$_(String(form.error))}</p>
	{/if}

	{#if bericht}
		<section class="admin-card">
			<h2 class="admin-card-title">
				{bericht.angewendet ? $_('Importiert') : $_('Vorschau — noch nichts gespeichert')}
			</h2>
			{#if bericht.angewendet}
				<p class="admin-notice admin-notice-ok">
					✓ {$_('Import abgeschlossen.')}
					{#if ersterMonat}
						<a
							href="/admin/assistenz?jahr={jahrVonMonat(ersterMonat, data.jahresbeginn)}"
							class="admin-link">{$_('Zur Jahresübersicht')} →</a
						>
					{/if}
				</p>
			{/if}

			{#if bericht.monate.length}
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>{$_('Monat')}</th>
								<th class="text-right">{$_('Personen mit Stunden')}</th>
								<th class="text-right">{$_('Tagstunden')}</th>
								<th class="text-right">{$_('Nachtstunden')}</th>
								<th>{$_('Status')}</th>
							</tr>
						</thead>
						<tbody>
							{#each bericht.monate as m (m.monat)}
								<tr class:admin-row-muted={m.status === 'leer'}>
									<td class="nowrap">{monatName(m.monat)}</td>
									<td class="text-right">{m.personen || '–'}</td>
									<td class="nowrap text-right">{m.tag ? fmtStunden(m.tag) : '–'}</td>
									<td class="nowrap text-right">{m.nacht ? fmtStunden(m.nacht) : '–'}</td>
									<td>
										<span class="admin-badge {STATUS[m.status].badge}"
											>{$_(STATUS[m.status].label)}</span
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<h3 class="mb-1 mt-4 text-sm font-semibold">{$_('Personen')}</h3>
			<p>
				{#if bericht.neuePersonen.length}
					{$_('Neu angelegt')}: {bericht.neuePersonen.join(', ')}
				{:else}
					{$_('Alle Personen sind schon erfasst.')}
				{/if}
			</p>

			<h3 class="mb-1 mt-4 text-sm font-semibold">{$_('Stundensätze')}</h3>
			{#if bericht.saetze === 'keine'}
				<p class="admin-muted">{$_('In der Datei wurden keine Stundensätze gefunden.')}</p>
			{:else}
				<ul class="m-0 list-disc pl-5">
					{#each bericht.saetzeListe as s (s.gueltigAb)}
						<li>
							{$_('ab')}
							{monatName(s.gueltigAb)}: {$_('Tag')} CHF {fmtChf(s.tag)} · {$_('Nacht')} CHF
							{fmtChf(
								s.nacht
							)}{#if s.ferien}{` · ${$_('Ferienentschädigung')} ${fmtStunden(s.ferien)} %`}{/if}{#each s.abzuege as a}{` · ${a.name} ${fmtStunden(a.prozent)} %`}{/each}
						</li>
					{/each}
				</ul>
				<p class="admin-hint">
					{bericht.saetze === 'neu'
						? $_('Werden übernommen.')
						: $_('Nicht übernommen, weil schon Stundensätze erfasst sind.')}
				</p>
			{/if}

			{#if bericht.hinweise.length}
				<h3 class="mb-1 mt-4 text-sm font-semibold">{$_('Hinweise')}</h3>
				<ul class="m-0 list-disc pl-5">
					{#each bericht.hinweise as h}
						<li>{hinweisText(h)}</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</div>
