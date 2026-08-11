<script lang="ts">
	export let data: { domain: string; siteName: string };

	// ── State ────────────────────────────────────────────────────────────────
	let loading = false;
	let error = '';

	interface LighthouseResult {
		deployUrl: string;
		deployedAt: string | null;
		formFactor: string;
		scores: {
			performance: number | null;
			accessibility: number | null;
			bestPractices: number | null;
			seo: number | null;
			pwa: number | null;
		};
	}

	let result: LighthouseResult | null = null;

	// ── Score helpers ─────────────────────────────────────────────────────────
	function scoreColor(s: number | null) {
		if (s == null) return '#ccc';
		if (s >= 90) return '#0cce6b';
		if (s >= 50) return '#ffa400';
		return '#ff4e42';
	}
	function scoreLabel(s: number | null) {
		if (s == null) return '—';
		if (s >= 90) return 'Gut';
		if (s >= 50) return 'Verbesserungsbedarf';
		return 'Schlecht';
	}

	// SVG gauge
	const R = 50;
	const CX = 60;
	const CY = 60;
	const CIRC = 2 * Math.PI * R;

	function dashArray(score: number | null) {
		if (score == null) return `0 ${CIRC.toFixed(1)}`;
		const filled = (score / 100) * CIRC;
		return `${filled.toFixed(1)} ${CIRC.toFixed(1)}`;
	}

	// ── Fetch ─────────────────────────────────────────────────────────────────
	async function loadReport() {
		error = '';
		result = null;
		loading = true;
		try {
			const res = await fetch('/api/lighthouse');
			const json = await res.json();
			if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
			result = json;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	}

	// ── Labels ────────────────────────────────────────────────────────────────
	const categoryLabels: { key: keyof LighthouseResult['scores']; label: string }[] = [
		{ key: 'performance', label: 'Performance' },
		{ key: 'accessibility', label: 'Barrierefreiheit' },
		{ key: 'bestPractices', label: 'Best Practices' },
		{ key: 'seo', label: 'SEO' },
		{ key: 'pwa', label: 'PWA' }
	];

	import { formatDateTimeShort } from '$lib/utils/formatDate';

	const formatDate = (iso: string | null) => (iso ? formatDateTimeShort(iso) : '');
</script>

<svelte:head>
	<title>Performance Report{data.siteName ? ` – ${data.siteName}` : ''}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<div class="header-inner">
			<div>
				<div class="header-eyebrow">Website Performance Report</div>
				<h1 class="header-title">{data.siteName || 'Performance Report'}</h1>
				{#if data.domain}
					<div class="header-domain">{data.domain}</div>
				{/if}
			</div>
			<div class="powered">
				Powered by<br />
				<strong>Netlify Lighthouse</strong>
			</div>
		</div>
	</div>

	<!-- Action -->
	<div class="controls-wrap">
		<div class="controls">
			<p class="controls-desc">
				Lighthouse wird automatisch nach jedem Deployment ausgeführt. Die Scores beziehen sich auf
				den letzten veröffentlichten Stand.
			</p>
			<button type="button" class="analyse-btn" on:click={loadReport} disabled={loading}>
				{#if loading}
					<span class="spinner"></span>
					Wird geladen …
				{:else}
					{result ? 'Aktualisieren' : 'Bericht laden'}
				{/if}
			</button>

			{#if error}
				<p class="error">{error}</p>
			{/if}
		</div>
	</div>

	<!-- Results -->
	{#if result}
		<div class="results-wrap">
			<!-- Meta -->
			<div class="result-meta">
				{#if result.deployUrl}
					<span class="meta-url">{result.deployUrl}</span>
					<span class="meta-sep">·</span>
				{/if}
				<span>Letztes Deployment:</span>
				<span class="meta-date">{formatDate(result.deployedAt)}</span>
			</div>

			<!-- Score gauges -->
			<div class="gauges gauges-5">
				{#each categoryLabels as cat}
					{@const score = result.scores[cat.key]}
					{@const color = scoreColor(score)}
					<div class="gauge-card">
						<svg
							viewBox="0 0 120 120"
							class="gauge-svg"
							aria-label="{cat.label}: {score ?? '—'} von 100"
						>
							<circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8eaed" stroke-width="10" />
							<circle
								cx={CX}
								cy={CY}
								r={R}
								fill="none"
								stroke={color}
								stroke-width="10"
								stroke-linecap="round"
								stroke-dasharray={dashArray(score)}
								transform="rotate(-90 {CX} {CY})"
							/>
							<text
								x={CX}
								y={CY + 8}
								text-anchor="middle"
								font-size="28"
								font-weight="700"
								fill={color}
								font-family="system-ui, sans-serif">{score ?? '—'}</text
							>
						</svg>
						<div class="gauge-label">{cat.label}</div>
						<div class="gauge-status" style="color:{color}">{scoreLabel(score)}</div>
					</div>
				{/each}
			</div>

			<!-- Legend -->
			<div class="legend">
				<div class="legend-item">
					<span class="dot" style="background:#0cce6b"></span>90–100 Gut
				</div>
				<div class="legend-item">
					<span class="dot" style="background:#ffa400"></span>50–89 Verbesserungsbedarf
				</div>
				<div class="legend-item">
					<span class="dot" style="background:#ff4e42"></span>0–49 Schlecht
				</div>
			</div>

			<p class="disclaimer">
				Scores werden von Netlify Lighthouse nach jedem Deployment gemessen ({result.formFactor ===
				'desktop'
					? 'Desktop'
					: 'Mobile'}). Werte können je nach Serverauslastung leicht variieren.
			</p>
		</div>
	{:else if !loading}
		<div class="empty-state">
			<svg
				viewBox="0 0 64 64"
				fill="none"
				stroke="#c5cae9"
				stroke-width="2"
				class="empty-icon"
				aria-hidden="true"
			>
				<circle cx="32" cy="32" r="28" />
				<polyline points="20 32 28 40 44 24" />
			</svg>
			<p>Klick auf «Bericht laden» um die Lighthouse-Scores des letzten Deployments anzuzeigen.</p>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
	}

	.page {
		min-height: 100vh;
		background: #f0f2f8;
		font-family: inherit;
	}

	/* Header */
	.header {
		background: linear-gradient(135deg, #1e2d5a 0%, #2a3f7a 100%);
		color: #fff;
		padding: 2.5rem 0 2rem;
	}
	.header-inner {
		max-width: 860px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
	}
	.header-eyebrow {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.65;
		margin-bottom: 0.35rem;
	}
	.header-title {
		margin: 0 0 0.25rem;
		font-size: 1.7rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.header-domain {
		font-size: 0.82rem;
		opacity: 0.55;
	}
	.powered {
		font-size: 0.72rem;
		opacity: 0.55;
		text-align: right;
		line-height: 1.5;
		flex-shrink: 0;
	}
	.powered strong {
		opacity: 0.9;
	}

	/* Controls */
	.controls-wrap {
		max-width: 860px;
		margin: 0 auto;
		padding: 1.75rem 1.5rem 0;
	}
	.controls {
		background: #fff;
		border-radius: 12px;
		padding: 1.5rem 1.75rem;
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.06),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.controls-desc {
		margin: 0;
		font-size: 0.85rem;
		color: #666;
		flex: 1;
		line-height: 1.5;
	}

	.analyse-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		flex-shrink: 0;
		padding: 0.75rem 1.75rem;
		background: #1e2d5a;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.1s;
		white-space: nowrap;
	}
	.analyse-btn:hover:not(:disabled) {
		background: #2a3f7a;
		transform: translateY(-1px);
	}
	.analyse-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		width: 15px;
		height: 15px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		width: 100%;
		margin: 0;
		padding: 0.65rem 0.9rem;
		background: #fdecea;
		border: 1px solid #f5c6c2;
		color: #c0392b;
		border-radius: 7px;
		font-size: 0.88rem;
	}

	/* Results */
	.results-wrap {
		max-width: 860px;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: #666;
	}
	.meta-url {
		font-weight: 600;
		color: #1e2d5a;
		word-break: break-all;
	}
	.meta-sep {
		opacity: 0.4;
	}
	.meta-date {
		font-weight: 600;
	}

	/* Gauges */
	.gauges {
		display: grid;
		gap: 1rem;
	}
	.gauges-5 {
		grid-template-columns: repeat(5, 1fr);
	}
	@media (max-width: 700px) {
		.gauges-5 {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (max-width: 480px) {
		.gauges-5 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.gauge-card {
		background: #fff;
		border-radius: 12px;
		padding: 1.25rem 0.75rem 1rem;
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.06),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}
	.gauge-svg {
		width: 110px;
		height: 110px;
	}
	.gauge-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: #333;
		text-align: center;
	}
	.gauge-status {
		font-size: 0.68rem;
		font-weight: 600;
		text-align: center;
	}

	/* Legend */
	.legend {
		display: flex;
		gap: 1.25rem;
		flex-wrap: wrap;
		align-items: center;
		font-size: 0.78rem;
		color: #555;
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.disclaimer {
		margin: 0;
		font-size: 0.72rem;
		color: #aaa;
		line-height: 1.5;
	}

	/* Empty */
	.empty-state {
		max-width: 860px;
		margin: 3rem auto;
		padding: 0 1.5rem;
		text-align: center;
		color: #aaa;
		font-size: 0.9rem;
	}
	.empty-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1rem;
		display: block;
	}
</style>
