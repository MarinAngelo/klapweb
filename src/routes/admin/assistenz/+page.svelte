<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	import {
		abzugNamen,
		berechneJahr,
		fmtChf,
		fmtStunden,
		monatName,
		monateDesJahres
	} from '$lib/assistenz';

	export let data: PageData;

	$: resultat = data.config ? berechneJahr(data.config, data.jahr, data.daten) : null;
	$: abzuege = resultat ? abzugNamen(resultat.monate) : [];
	$: monate = data.config ? monateDesJahres(data.jahr, data.config.jahresbeginn) : [];
	$: zeitraum = monate.length ? `${monatName(monate[0])} – ${monatName(monate[11])}` : '';
	$: ohnePersonen = !!data.config && data.config.personen.length === 0;
	$: ohneSaetze = !!data.config && data.config.saetze.length === 0;
</script>

<svelte:head><title>{$_('Assistenz')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Assistenz')}>
		{#if data.config}
			<a href="/admin/assistenz/assistenz.csv?jahr={data.jahr}" class="admin-btn" download
				>↓ {$_('CSV-Export')}</a
			>
			<a href="/admin/assistenz/einstellungen" class="admin-btn">{$_('Personen & Sätze')}</a>
		{/if}
	</AdminHeader>

	<p class="admin-intro">
		{$_(
			'Monatliche Tag- und Nachtstunden der Assistenzpersonen, daraus Lohn, Abzüge und Totale. Zum Erfassen einen Monat öffnen.'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}

	{#if ohnePersonen || ohneSaetze}
		<p class="admin-notice admin-notice-warn">
			{#if ohnePersonen}{$_('Noch keine Personen erfasst.')}{/if}
			{#if ohneSaetze}{$_('Noch keine Stundensätze erfasst.')}{/if}
			<a href="/admin/assistenz/einstellungen" class="admin-link">{$_('Personen & Sätze')} →</a>
		</p>
	{/if}

	{#if resultat}
		<!-- ── Year navigation ─────────────────────────────────────────── -->
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<a
				href="?jahr={data.jahr - 1}"
				class="admin-btn admin-btn-sm"
				aria-label={$_('Vorheriges Jahr')}>←</a
			>
			<h2 class="m-0 text-lg font-semibold">{zeitraum}</h2>
			<a
				href="?jahr={data.jahr + 1}"
				class="admin-btn admin-btn-sm"
				aria-label={$_('Nächstes Jahr')}>→</a
			>
		</div>

		<!-- ── Months ──────────────────────────────────────────────────── -->
		<section class="admin-card">
			<h2 class="admin-card-title">{$_('Monate')}</h2>
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							<th>{$_('Monat')}</th>
							<th class="text-right">{$_('Tagstunden')}</th>
							<th class="text-right">{$_('Nachtstunden')}</th>
							<th class="text-right">{$_('Stunden total')}</th>
							<th class="text-right">{$_('Lohn brutto CHF')}</th>
							<th class="text-right">{$_('Abzüge total CHF')}</th>
							<th class="text-right">{$_('Lohn netto CHF')}</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each resultat.monate as m (m.monat)}
							<tr class:admin-row-muted={!m.erfasst}>
								<td class="nowrap">
									<a href="/admin/assistenz/{m.monat}" class="admin-link">{monatName(m.monat)}</a>
									{#if m.monat === data.aktuellerMonat}
										<span class="admin-badge admin-badge-blue">{$_('aktuell')}</span>
									{/if}
								</td>
								{#if m.erfasst}
									<td class="nowrap text-right">{fmtStunden(m.total.tag)}</td>
									<td class="nowrap text-right">{fmtStunden(m.total.nacht)}</td>
									<td class="nowrap text-right">{fmtStunden(m.total.stunden)}</td>
									<td class="nowrap text-right">{m.saetze ? fmtChf(m.total.brutto) : '–'}</td>
									<td class="nowrap text-right">{m.saetze ? fmtChf(m.total.abzuegeTotal) : '–'}</td>
									<td class="nowrap text-right">{m.saetze ? fmtChf(m.total.netto) : '–'}</td>
								{:else}
									<td colspan="6" class="admin-muted">{$_('Noch nichts erfasst')}</td>
								{/if}
								<td class="nowrap text-right">
									<a href="/admin/assistenz/{m.monat}" class="admin-btn admin-btn-sm"
										>{m.erfasst ? $_('Bearbeiten') : $_('Erfassen')}</a
									>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="font-semibold">
							<td>{$_('Jahrestotal')}</td>
							<td class="nowrap text-right">{fmtStunden(resultat.total.tag)}</td>
							<td class="nowrap text-right">{fmtStunden(resultat.total.nacht)}</td>
							<td class="nowrap text-right">{fmtStunden(resultat.total.stunden)}</td>
							<td class="nowrap text-right">{fmtChf(resultat.total.brutto)}</td>
							<td class="nowrap text-right">{fmtChf(resultat.total.abzuegeTotal)}</td>
							<td class="nowrap text-right">{fmtChf(resultat.total.netto)}</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			</div>
		</section>

		<!-- ── Per person ──────────────────────────────────────────────── -->
		<section class="admin-card">
			<h2 class="admin-card-title">{$_('Jahrestotal pro Person')}</h2>
			{#if resultat.proPerson.length === 0}
				<p class="admin-empty">{$_('Noch nichts erfasst')}</p>
			{:else}
				<div class="admin-table-wrap">
					<table class="admin-table">
						<thead>
							<tr>
								<th>{$_('Person')}</th>
								<th>{$_('Anstellung')}</th>
								<th class="text-right">{$_('Tagstunden')}</th>
								<th class="text-right">{$_('Nachtstunden')}</th>
								<th class="text-right">{$_('Stunden total')}</th>
								<th class="text-right">{$_('Taglohn CHF')}</th>
								<th class="text-right">{$_('Nachtlohn CHF')}</th>
								<th class="text-right">{$_('Lohn brutto CHF')}</th>
								{#each abzuege as name}
									<th class="text-right">{name} CHF</th>
								{/each}
								<th class="text-right">{$_('Abzüge total CHF')}</th>
								<th class="text-right">{$_('Lohn netto CHF')}</th>
							</tr>
						</thead>
						<tbody>
							{#each resultat.proPerson as { person, total } (person.id)}
								<tr>
									<td class="nowrap">{person.name}</td>
									<td>{person.anstellung || '–'}</td>
									<td class="nowrap text-right">{fmtStunden(total.tag)}</td>
									<td class="nowrap text-right">{fmtStunden(total.nacht)}</td>
									<td class="nowrap text-right">{fmtStunden(total.stunden)}</td>
									<td class="nowrap text-right">{fmtChf(total.taglohn)}</td>
									<td class="nowrap text-right">{fmtChf(total.nachtlohn)}</td>
									<td class="nowrap text-right">{fmtChf(total.brutto)}</td>
									{#each abzuege as name}
										<td class="nowrap text-right">{fmtChf(total.abzuege[name] ?? 0)}</td>
									{/each}
									<td class="nowrap text-right">{fmtChf(total.abzuegeTotal)}</td>
									<td class="nowrap text-right">{fmtChf(total.netto)}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="font-semibold">
								<td colspan="2">{$_('Total')}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.tag)}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.nacht)}</td>
								<td class="nowrap text-right">{fmtStunden(resultat.total.stunden)}</td>
								<td class="nowrap text-right">{fmtChf(resultat.total.taglohn)}</td>
								<td class="nowrap text-right">{fmtChf(resultat.total.nachtlohn)}</td>
								<td class="nowrap text-right">{fmtChf(resultat.total.brutto)}</td>
								{#each abzuege as name}
									<td class="nowrap text-right">{fmtChf(resultat.total.abzuege[name] ?? 0)}</td>
								{/each}
								<td class="nowrap text-right">{fmtChf(resultat.total.abzuegeTotal)}</td>
								<td class="nowrap text-right">{fmtChf(resultat.total.netto)}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</section>
	{/if}
</div>
