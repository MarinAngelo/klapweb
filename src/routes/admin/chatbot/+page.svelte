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
	const fmtDateTime = (iso: string) =>
		new Date(iso).toLocaleString('de-CH', {
			timeZone: 'Europe/Zurich',
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	const fmtTime = (iso: string) =>
		new Date(iso).toLocaleTimeString('de-CH', {
			timeZone: 'Europe/Zurich',
			hour: '2-digit',
			minute: '2-digit'
		});
	const inputTokens = (t: Totals) => t.input + t.cacheWrite + t.cacheRead;
	const perQuestion = (t: Totals) => (t.questions ? t.usd / t.questions : 0);

	$: selected = data.months.find((m) => m.period === data.month)?.totals ?? null;
	// Visitor ratings of the answers in this month (chat widget 👍/👎)
	const countRatings = (entries: { rating?: string }[], rating: string) =>
		entries.filter((e) => e.rating === rating).length;
	$: allEntries = data.conversations.flatMap((c) => c.entries);
	$: ratedUp = countRatings(allEntries, 'up');
	$: ratedDown = countRatings(allEntries, 'down');
	$: ratedTotal = ratedUp + ratedDown;
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

<svelte:head><title>{$_('Chat-Bot')}</title></svelte:head>

<div class="admin-container">
	<AdminHeader title={$_('Chat-Bot')} />

	<p class="admin-intro">
		{$_(
			'Geschätzte Kosten der KI-Antworten nach den Listenpreisen des Anbieters (Anthropic, Claude Haiku). Verbindlich ist die Abrechnung des Anbieters.'
		)}
	</p>

	{#if data.loadError}
		<p class="admin-notice admin-notice-error admin-mono">{$_('Fehler')}: {data.loadError}</p>
	{/if}

	<h2 class="mb-3">{fmtMonth(data.month)}</h2>
	<div class="admin-stats md:grid-cols-4">
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
		<div class="admin-stat">
			<span class="admin-stat-value"
				>{ratedTotal ? `${Math.round((ratedUp / ratedTotal) * 100)} %` : '–'}</span
			>
			<span class="admin-stat-label">{$_('Hilfreich')} ({ratedUp} 👍 / {ratedDown} 👎)</span>
		</div>
	</div>

	<section class="admin-card">
		<h3 class="admin-card-title">{$_('Gespräche')} ({data.conversations.length})</h3>
		<p class="admin-hint mb-3">
			{$_(
				'Fragen und Antworten werden ohne IP-Adresse gespeichert und nach {tage} Tagen automatisch gelöscht.'
			).replace('{tage}', String(data.retentionDays))}
		</p>
		{#if data.conversations.length === 0}
			<p class="admin-empty">{$_('Noch keine Einträge.')}</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each data.conversations as c (c.id)}
					<details class="rounded border border-gray-200">
						<summary class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
							<span class="font-semibold">{fmtDateTime(c.start)}</span>
							<span class="admin-muted"
								>{c.entries.length}
								{c.entries.length === 1 ? $_('Frage') : $_('Fragen')}</span
							>
							<span class="admin-badge admin-badge-blue">{c.lang || '–'}</span>
							{#if countRatings(c.entries, 'up')}<span class="admin-badge admin-badge-green"
									>👍 {countRatings(c.entries, 'up')}</span
								>{/if}
							{#if countRatings(c.entries, 'down')}<span class="admin-badge admin-badge-red"
									>👎 {countRatings(c.entries, 'down')}</span
								>{/if}
							{#if c.page}<span class="admin-mono admin-muted">{c.page}</span>{/if}
							<span class="admin-muted ml-auto">{fmtUsd(c.usd)}</span>
						</summary>
						<div class="flex flex-col gap-3 border-t border-gray-200 px-3 py-3">
							{#each c.entries as e (e.at)}
								<div class="flex flex-col gap-1">
									<span class="admin-muted text-xs">{fmtTime(e.at)}</span>
									<p class="m-0 whitespace-pre-wrap rounded bg-gray-100 px-3 py-2">
										<span class="font-semibold">{$_('Frage')}:</span>
										{e.question}
									</p>
									<p class="m-0 whitespace-pre-wrap rounded border border-gray-200 px-3 py-2">
										<span class="font-semibold">{$_('Antwort')}:</span>
										{e.answer}
									</p>
									{#if e.rating}
										<p class="m-0 text-sm">
											<span
												class="admin-badge {e.rating === 'up'
													? 'admin-badge-green'
													: 'admin-badge-red'}"
												>{e.rating === 'up'
													? `👍 ${$_('Hilfreich')}`
													: `👎 ${$_('Nicht hilfreich')}`}</span
											>
											{#if e.ratingComment}<span class="ml-2 whitespace-pre-wrap"
													>«{e.ratingComment}»</span
												>{/if}
										</p>
									{/if}
								</div>
							{/each}
							<form
								method="POST"
								action="?/deleteConversation&monat={data.month}"
								on:submit={(ev) => {
									if (!confirm($_('Dieses Gespräch endgültig löschen?'))) ev.preventDefault();
								}}
							>
								<input type="hidden" name="month" value={data.month} />
								<input type="hidden" name="conversation" value={c.id} />
								<button class="admin-btn admin-btn-danger admin-btn-sm"
									>{$_('Gespräch löschen')}</button
								>
							</form>
						</div>
					</details>
				{/each}
			</div>
		{/if}
	</section>

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
