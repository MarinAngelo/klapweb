<script lang="ts">
	import type { PageData } from './$types';
	import Button from '$lib/components/Button.svelte';
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

	const cell = 'padding: 0.5rem 0.75rem; white-space: nowrap;';
	const cellRight = `${cell} text-align: right;`;
	const card =
		'background: white; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 1rem 1.25rem;';
</script>

<svelte:head><title>{$_('Chat-Bot')} – {$_('Kosten')}</title></svelte:head>

<div style="font-family: sans-serif; padding: 2rem; max-width: 1000px; margin: 0 auto;">
	<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
		<h1 style="font-size: 1.5rem; font-weight: bold; margin: 0;">
			{$_('Chat-Bot')} – {$_('Kosten')}
		</h1>
		<div style="margin-left: auto;">
			<Button
				href="/admin/dashboard"
				text={$_('Dashboard')}
				leadingIcon="left"
				color="#374151"
				bgColor="transparent"
				hoverColor="#111827"
				hoverBgColor="transparent"
				size="sm"
				mb={false}
			/>
		</div>
	</div>

	<p style="font-size: 0.875rem; color: #6b7280; margin: 0 0 1.5rem;">
		{$_(
			'Geschätzte Kosten der KI-Antworten nach den Listenpreisen des Anbieters (Anthropic, Claude Haiku). Verbindlich ist die Abrechnung des Anbieters.'
		)}
	</p>

	{#if data.loadError}
		<p style="color: #dc2626; font-family: monospace; font-size: 0.8rem;">
			{$_('Fehler')}: {data.loadError}
		</p>
	{/if}

	<h2 style="font-size: 1.125rem; margin: 0 0 0.75rem;">{fmtMonth(data.month)}</h2>
	<div
		style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;"
	>
		<div style={card}>
			<div style="font-size: 0.8rem; color: #6b7280;">{$_('Fragen')}</div>
			<div style="font-size: 1.5rem; font-weight: 600;">{fmtNumber(selected?.questions ?? 0)}</div>
		</div>
		<div style={card}>
			<div style="font-size: 0.8rem; color: #6b7280;">{$_('Kosten')}</div>
			<div style="font-size: 1.5rem; font-weight: 600;">{fmtUsd(selected?.usd ?? 0)}</div>
		</div>
		<div style={card}>
			<div style="font-size: 0.8rem; color: #6b7280;">{$_('Durchschnitt pro Frage')}</div>
			<div style="font-size: 1.5rem; font-weight: 600;">
				{fmtUsd(selected ? perQuestion(selected) : 0)}
			</div>
		</div>
	</div>

	<h3 style="font-size: 1rem; margin: 0 0 0.5rem;">{$_('Pro Tag')}</h3>
	{#if data.days.length === 0}
		<p style="opacity: 0.5; margin-bottom: 2rem;">{$_('Noch keine Einträge.')}</p>
	{:else}
		<div style="overflow-x: auto; margin-bottom: 2rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each cols as col, i}
							<th style={i === 0 ? cell : cellRight}>{$_(col)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.days as row (row.period)}
						<tr style="border-bottom: 1px solid #e5e7eb;">
							<td style={cell}>{fmtDay(row.period)}</td>
							<td style={cellRight}>{fmtNumber(row.totals.questions)}</td>
							<td style={cellRight}>{fmtNumber(inputTokens(row.totals))}</td>
							<td style={cellRight}>{fmtNumber(row.totals.cacheRead)}</td>
							<td style={cellRight}>{fmtNumber(row.totals.output)}</td>
							<td style={cellRight}>{fmtUsd(row.totals.usd)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<h3 style="font-size: 1rem; margin: 0 0 0.5rem;">{$_('Pro Monat')}</h3>
	{#if data.months.length === 0}
		<p style="opacity: 0.5;">{$_('Noch keine Einträge.')}</p>
	{:else}
		<div style="overflow-x: auto; margin-bottom: 2rem;">
			<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
				<thead>
					<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;">
						{#each cols as col, i}
							<th style={i === 0 ? cell : cellRight}>{$_(col)}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.months as row (row.period)}
						<tr
							style="border-bottom: 1px solid #e5e7eb; {row.period === data.month
								? 'background: #f3f4f6; font-weight: 600;'
								: ''}"
						>
							<td style={cell}>
								<a href="?monat={row.period}" style="color: inherit;">{fmtMonth(row.period)}</a>
							</td>
							<td style={cellRight}>{fmtNumber(row.totals.questions)}</td>
							<td style={cellRight}>{fmtNumber(inputTokens(row.totals))}</td>
							<td style={cellRight}>{fmtNumber(row.totals.cacheRead)}</td>
							<td style={cellRight}>{fmtNumber(row.totals.output)}</td>
							<td style={cellRight}>{fmtUsd(row.totals.usd)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<p style="font-size: 0.75rem; color: #9ca3af;">
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
