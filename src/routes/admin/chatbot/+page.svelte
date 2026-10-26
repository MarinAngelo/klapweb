<script lang="ts">
	import type { PageData } from './$types';
	import AdminHeader from '$lib/components/admin/AdminHeader.svelte';
	import { _ } from '$lib/stores/i18n';
	export let data: PageData;

	type Totals = (typeof data.months)[number]['totals'];

	const numberFormat = new Intl.NumberFormat('de-CH');
	const fmtNumber = (n: number) => numberFormat.format(n);
	// Small amounts need more decimals to be meaningful (a question costs fractions of a cent)
	const fmtUsd = (n: number) => `$ ${n.toFixed(n >= 1 || n === 0 ? 2 : 4)}`;
	const fmtMonth = (period: string) =>
		new Date(`${period}-01T12:00:00`).toLocaleDateString('de-CH', {
			month: 'long',
			year: 'numeric'
		});
	const fmtDay = (period: string) =>
		new Date(`${period}T12:00:00`).toLocaleDateString('de-CH', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	const inputTokens = (t: Totals) => t.input + t.cacheWrite + t.cacheRead;
	const perQuestion = (t: Totals) => (t.questions ? t.usd / t.questions : 0);

	$: selected = data.months.find((m) => m.period === data.month)?.totals ?? null;
	// Column headers are i18n keys
	const cols = [
		'Zeitraum',
		'Fragen',
		'Tokens Eingabe',
		'davon aus Cache',
		'Tokens Antwort',
		'Kosten'
	];
</script>

<svelte:head><title>{$_('Chat-Bot')} – {$_('Kosten')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title="{$_('Chat-Bot')} – {$_('Kosten')}" />

	<p class="admin-intro">
		{$_(
			'Geschätzte Kosten der KI-Antworten nach den Listenpreisen des Anbieters (Anthropic, Claude Haiku). Verbindlich ist die Abrechnung des Anbieters.'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}

	<h2 class="mb-3">{fmtMonth(data.month)}</h2>
	<div class="admin-stats md:grid-cols-3">
		<div class="admin-stat">
			<span class="admin-stat-value">{fmtNumber(selected?.questions ?? 0)}</span>
			<span class="admin-stat-label">{$_('Fragen')}</span>
		</div>
		<div class="admin-stat">
			<span class="admin-stat-value">{fmtUsd(selected?.usd ?? 0)}</span>
			<span class="admin-stat-label">{$_('Kosten')}</span>
		</div>
		<div class="admin-stat">
			<span class="admin-stat-value">{fmtUsd(selected ? perQuestion(selected) : 0)}</span>
			<span class="admin-stat-label">{$_('Durchschnitt pro Frage')}</span>
		</div>
	</div>

	<section class="admin-card">
		<h3 class="admin-card-title">{$_('Pro Tag')}</h3>
		{#if data.days.length === 0}
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							{#each cols as col, i}
								<th class:text-right={i > 0}>{$_(col)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.days as row (row.period)}
							<tr>
								<td class="nowrap">{fmtDay(row.period)}</td>
								<td class="nowrap text-right">{fmtNumber(row.totals.questions)}</td>
								<td class="nowrap text-right">{fmtNumber(inputTokens(row.totals))}</td>
								<td class="nowrap text-right">{fmtNumber(row.totals.cacheRead)}</td>
								<td class="nowrap text-right">{fmtNumber(row.totals.output)}</td>
								<td class="nowrap text-right">{fmtUsd(row.totals.usd)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="admin-card">
		<h3 class="admin-card-title">{$_('Pro Monat')}</h3>
		{#if data.months.length === 0}
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		{:else}
			<div class="admin-table-wrap">
				<table class="admin-table">
					<thead>
						<tr>
							{#each cols as col, i}
								<th class:text-right={i > 0}>{$_(col)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.months as row (row.period)}
							<tr
								class:bg-gray-100={row.period === data.month}
								class:font-semibold={row.period === data.month}
							>
								<td class="nowrap"
									><a href="?monat={row.period}" class="admin-link">{fmtMonth(row.period)}</a></td
								>
								<td class="nowrap text-right">{fmtNumber(row.totals.questions)}</td>
								<td class="nowrap text-right">{fmtNumber(inputTokens(row.totals))}</td>
								<td class="nowrap text-right">{fmtNumber(row.totals.cacheRead)}</td>
								<td class="nowrap text-right">{fmtNumber(row.totals.output)}</td>
								<td class="nowrap text-right">{fmtUsd(row.totals.usd)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<p class="admin-hint">
		{$_('Berechnungsgrundlage pro Million Tokens')}: {$_('Eingabe')}
		{fmtUsd(data.prices.input)} · {$_('Cache schreiben')}
		{fmtUsd(data.prices.cacheWrite)} · {$_('Cache lesen')}
		{fmtUsd(data.prices.cacheRead)} · {$_('Antwort')}
		{fmtUsd(data.prices.output)}.
		{$_(
			'Die Wissensbasis wird 5 Minuten zwischengespeichert: Folgefragen in dieser Zeit sind deutlich günstiger.'
		)}
	</p>
</div>
