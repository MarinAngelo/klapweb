<script lang="ts">
	import { onMount } from 'svelte';

	interface TocEntry {
		id: string;
		text: string;
		level: number;
	}
	let tocEntries: TocEntry[] = [];
	let activeId = '';

	onMount(() => {
		const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
		tocEntries = sections.map((el) => ({
			id: el.id,
			text: el.querySelector('h2')?.textContent?.trim() ?? '',
			level: 2
		}));

		const obs = new IntersectionObserver(
			(entries) => {
				const hit = entries.find((e) => e.isIntersecting);
				if (hit?.target.id) activeId = hit.target.id;
			},
			{ rootMargin: '-10% 0px -40% 0px' }
		);
		sections.forEach((el) => obs.observe(el));
		return () => obs.disconnect();
	});
</script>

<svelte:head>
	<title>Dev-Dokumentation · klap-web</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="layout">
	<!-- Linke Spalte: Sticky TOC -->
	<aside class="sidebar">
		<div class="sidebar-inner">
			<a href="/" class="back">← zurück</a>
			<p class="sidebar-label">Inhalt</p>
			<nav>
				<ul>
					{#each tocEntries as entry}
						<li class:h3={entry.level === 3} class:active={entry.id === activeId}>
							<a href="#{entry.id}">{entry.text}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>
	</aside>

	<!-- Rechte Spalte: Inhalt -->
	<main class="content">
		<header class="page-header">
			<h1>Dev-Dokumentation</h1>
			<p class="subtitle">Interne Referenz · <code>Inhaltsverzeichnis</code>-Slice</p>
		</header>

		<section id="inhaltsverzeichnis">
			<h2>Slice: Inhaltsverzeichnis</h2>
			<p>
				Ein seitenweites Inhaltsverzeichnis, das alle <code>h2</code>- und
				<code>h3</code>-Überschriften einer Seite automatisch aggregiert — unabhängig davon, in
				welchem Slice sie gerendert wurden. Der Slice selbst enthält keinen Inhalt, sondern scannt
				das DOM beim Mounten.
			</p>
			<div class="callout">
				<strong>Kernidee:</strong> Statt jeder Slice-Instanz ein eigenes TOC zu geben, wird der
				<code>Inhaltsverzeichnis</code>-Slice einmal auf der Seite platziert. Er liest alle
				Überschriften aus <code>main h2, main h3</code> — page-weit.
			</div>
		</section>

		<section id="dateien">
			<h2>Involvierte Dateien</h2>
			<table>
				<thead><tr><th>Datei</th><th>Zweck</th></tr></thead>
				<tbody>
					<tr>
						<td><code>src/lib/slices/Inhaltsverzeichnis/index.svelte</code></td>
						<td
							>Haupt-Implementierung: DOM-Scan, TOC-Rendering, beide Layout-Modi, Mobile
							Bottom-Sheet</td
						>
					</tr>
					<tr>
						<td><code>src/lib/slices/Inhaltsverzeichnis/model.json</code></td>
						<td>Prismic-Slice-Definition mit allen CMS-Feldern</td>
					</tr>
					<tr>
						<td><code>src/lib/slices/index.ts</code></td>
						<td>Registriert den Slice als <code>inhaltsverzeichnis</code> in der SliceZone</td>
					</tr>
					<tr>
						<td><code>customtypes/page/base.json</code></td>
						<td>Macht den Slice auf Seiten-Custom-Types verfügbar (Slice-Choices)</td>
					</tr>
					<tr>
						<td><code>gating.json</code></td>
						<td
							>Plan-Gate: <code>"Inhaltsverzeichnis": &#123; "plan": "professional" &#125;</code
							></td
						>
					</tr>
					<tr>
						<td><code>src/lib/utils/color.ts</code></td>
						<td
							><code>hexLuminance()</code> + <code>shadeColor()</code> für Kontrast-Berechnung der Mobile-Farben</td
						>
					</tr>
					<tr>
						<td><code>src/app.css</code></td>
						<td
							><code>scroll-behavior: smooth</code> + <code>scroll-padding-top</code> für Anker-Navigation</td
						>
					</tr>
				</tbody>
			</table>
		</section>

		<section id="cms-felder">
			<h2>CMS-Felder (Prismic)</h2>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr>
						<td><code>title</code></td>
						<td>Text</td>
						<td>Bezeichnung des TOC (z.B. «Inhalt»). Default: <em>«Inhalt»</em></td>
					</tr>
					<tr>
						<td><code>tiefe</code></td>
						<td>Select</td>
						<td>«Nur H2» oder «H2 und H3» — steuert den DOM-Selektor</td>
					</tr>
					<tr>
						<td><code>ausrichtung</code></td>
						<td>Select</td>
						<td>«Oben» (horizontale Leiste) oder «Links» (Fixed Sidebar)</td>
					</tr>
					<tr>
						<td><code>bg_color</code></td>
						<td>Color</td>
						<td>Hintergrundfarbe Desktop. Fallback: globale <code>pageBgColor</code></td>
					</tr>
					<tr>
						<td><code>color</code></td>
						<td>Color</td>
						<td>Textfarbe Desktop. Fallback: globale <code>pageColor</code></td>
					</tr>
				</tbody>
			</table>
		</section>

		<section id="funktionsweise">
			<h2>Funktionsweise (onMount)</h2>
			<p>Beim Mounten läuft folgender Ablauf:</p>
			<ol>
				<li>DOM-Selektor: <code>tiefe === 'Nur H2' ? 'main h2' : 'main h2, main h3'</code></li>
				<li>
					Alle gefundenen Headings iterieren. Falls kein <code>id</code>: ID via
					<code>toSlug(el.textContent)</code> setzen (Umlaute transkribiert, Sonderzeichen entfernt).
				</li>
				<li><code>tocEntries[]</code> aufbauen: <code>&#123; id, text, level: 2|3 &#125;</code></li>
				<li>
					<code>tocGroups[]</code> reaktiv berechnen: jede H2 mit ihren nachfolgenden H3s als Gruppe.
				</li>
				<li>
					<code>IntersectionObserver</code> auf alle Headings:
					<code>rootMargin: '-10% 0px -60% 0px'</code>
					→ <code>activeId</code> aktualisiert sich beim Scrollen.
				</li>
				<li>
					Im «Links»-Modus: zweiter Observer auf <code>anchorEl</code> toggelt
					<code>sidebarVisible</code>.
				</li>
				<li>
					Scroll-Listener: <code>dismissed = false</code> nach 80px Scroll-Delta seit dem Schliessen.
				</li>
			</ol>
			<div class="callout callout-warn">
				<strong>Wichtig:</strong> Das DOM-Scanning findet alle Headings in <code>main</code>, auch
				solche in Slices die <em>nach</em> dem Inhaltsverzeichnis-Slice gerendert werden. Slice-Reihenfolge
				spielt keine Rolle.
			</div>
		</section>

		<section id="desktop-oben">
			<h2>Desktop – Modus «Oben»</h2>
			<p>
				Horizontale Flex-Leiste. H2-Einträge erscheinen als Spalten, jede mit H3-Unterpunkten
				darunter (vertikale Trennlinie links). Aktiver Eintrag: <code>font-weight: 700</code> +
				<code>border-bottom: 2px solid</code>. Inaktive H3-Gruppe: <code>opacity: 0.4</code>,
				aktiver H3 darin: <code>opacity: 1</code>.
			</p>
		</section>

		<section id="desktop-links">
			<h2>Desktop – Modus «Links»</h2>
			<p><code>position: fixed</code> Sidebar am linken Rand:</p>
			<ul>
				<li>Position: <code>left: 1.5rem</code>, <code>top: calc(--header-height + 2rem)</code></li>
				<li>
					Breite: <code>13rem</code>, <code>max-height</code> mit <code>overflow-y: auto</code>
				</li>
				<li>
					Einblenden via CSS-Klasse <code>.visible</code>:
					<code>opacity: 1; pointer-events: auto; transform: translateX(0)</code>
				</li>
				<li>
					<strong>×-Button:</strong> setzt <code>dismissed = true</code> +
					<code>dismissedAtY = window.scrollY</code>. Nach 80px: <code>dismissed = false</code>.
				</li>
			</ul>
			<div class="callout callout-warn">
				Der <code>Bounded</code>-Block hat im «Links»-Modus <code>padding: 0</code> (<code
					>.toc-links-mode</code
				>) — die Sidebar ist <code>fixed</code> und belegt keinen Flow-Platz.
			</div>
		</section>

		<section id="mobile">
			<h2>Mobile – Sticky Bottom-Sheet</h2>
			<p>
				<code>position: fixed; bottom: 0; left: 0; right: 0</code> — immer am unteren Rand wenn
				<code>tocEntries.length &gt; 0</code>.
			</p>
			<ul>
				<li>
					<strong>Leiste</strong> (immer sichtbar): zeigt <code>tocTitle</code> + aktiven Abschnittstext.
					Tippen öffnet die Liste.
				</li>
				<li>
					<strong>Liste</strong> (<code>mobileOpen</code>): hierarchisch, max-height
					<code>50vh</code>. Link-Klick schliesst + scrollt.
				</li>
				<li>
					<strong>Farben:</strong> <code>$theme.headerBgColor</code>/<code>headerColor</code>.
					Inaktive Einträge via <code>shadeColor(mobileBg, ±110)</code> — kein
					<code>opacity</code>-Missbrauch.
				</li>
			</ul>
		</section>

		<section id="id-generierung">
			<h2>ID-Generierung (<code>toSlug</code>)</h2>
			<pre>const toSlug = (s) =&gt; s
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe')
  .replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');</pre>
			<p>
				IDs werden nur gesetzt wenn das Element noch keine hat. Bestehende IDs werden respektiert.
			</p>
			<div class="callout callout-warn">
				Doppelte Texte → doppelte IDs. Browser verlinkt zum ersten Treffer. H2/H3-Texte auf einer
				Seite eindeutig halten.
			</div>
		</section>

		<section id="farben">
			<h2>Farb-Logik</h2>
			<table>
				<thead><tr><th>Bereich</th><th>Quelle</th><th>Fallback</th></tr></thead>
				<tbody>
					<tr
						><td>Desktop bg</td><td><code>slice.primary.bg_color</code></td><td
							><code>$theme.pageBgColor</code></td
						></tr
					>
					<tr
						><td>Desktop text</td><td><code>slice.primary.color</code></td><td
							><code>$theme.pageColor</code></td
						></tr
					>
					<tr
						><td>Mobile bg</td><td><code>$theme.headerBgColor</code></td><td
							><code>bgColor → $theme.pageBgColor</code></td
						></tr
					>
					<tr
						><td>Mobile aktiv</td><td><code>$theme.headerColor</code></td><td
							><code>textColor</code></td
						></tr
					>
					<tr
						><td>Mobile inaktiv</td><td colspan="2"
							><code>shadeColor(mobileBg, hexLuminance(mobileBg) &gt; 0.5 ? -110 : 110)</code></td
						></tr
					>
				</tbody>
			</table>
		</section>

		<section id="registration">
			<h2>Registrierung &amp; Gating</h2>
			<ol>
				<li>
					<strong><code>src/lib/slices/index.ts</code></strong>: Import +
					<code>inhaltsverzeichnis: Inhaltsverzeichnis</code>
				</li>
				<li>
					<strong><code>customtypes/page/base.json</code></strong>:
					<code>"inhaltsverzeichnis": &#123; "type": "SharedSlice" &#125;</code>
					in <code>json.Main.slices.config.choices</code>
				</li>
				<li>
					<strong><code>gating.json</code></strong>:
					<code>"Inhaltsverzeichnis": &#123; "plan": "professional" &#125;</code>
				</li>
				<li>
					<strong><code>slicemachine push</code></strong>: nach Änderungen an
					<code>model.json</code> ausführen
				</li>
			</ol>
		</section>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		background: var(--doku-bg);
		color: var(--doku-text);
	}

	.layout {
		display: grid;
		grid-template-columns: 16rem 1fr;
		min-height: 100vh;
		font-family: var(--page-font), sans-serif;
		font-size: 0.95rem;
		line-height: 1.7;
	}

	/* ── Sidebar ── */
	.sidebar {
		border-right: 1px solid var(--doku-border);
		background: var(--doku-sidebar-bg);
	}
	.sidebar-inner {
		position: sticky;
		top: 0;
		padding: 2rem 1.25rem;
		height: 100vh;
		overflow-y: auto;
		box-sizing: border-box;
	}
	.back {
		display: inline-block;
		color: var(--doku-text-dim);
		text-decoration: none;
		font-size: 0.8rem;
		margin-bottom: 1.5rem;
	}
	.back:hover {
		color: var(--doku-text);
	}
	.sidebar-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--doku-text-faint);
		margin: 0 0 0.75rem;
	}
	nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	nav li {
		margin: 0;
	}
	nav li a {
		display: block;
		padding: 0.3rem 0.5rem;
		border-radius: 0.25rem;
		color: var(--doku-nav-link);
		text-decoration: none;
		font-size: 0.85rem;
		transition:
			color 0.15s,
			background 0.15s;
	}
	nav li.h3 a {
		padding-left: 1.25rem;
		font-size: 0.8rem;
		color: var(--doku-text-dim);
	}
	nav li a:hover {
		color: var(--doku-text);
		background: var(--doku-surface);
	}
	nav li.active > a {
		color: var(--doku-nav-active);
		font-weight: 600;
		background: var(--doku-surface);
	}

	/* ── Content ── */
	.content {
		padding: 3rem 3.5rem 6rem;
	}
	.page-header {
		margin-bottom: 3rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--doku-border);
	}
	h1 {
		font-size: 1.875rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
		color: var(--doku-heading);
	}
	.subtitle {
		color: var(--doku-text-dim);
		margin: 0;
		font-size: 0.9rem;
	}
	h2 {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--doku-heading);
		margin: 0 0 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--doku-border);
		scroll-margin-top: 2rem;
	}
	section {
		margin-bottom: 3.5rem;
	}
	p {
		margin: 0 0 1rem;
		color: var(--doku-text-muted);
	}
	ol,
	ul {
		color: var(--doku-text-muted);
		padding-left: 1.5rem;
	}
	li {
		margin-bottom: 0.4rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}
	th {
		background: var(--doku-surface);
		text-align: left;
		padding: 0.5rem 0.75rem;
		font-weight: 600;
		color: var(--doku-table-header);
		border: 1px solid var(--doku-surface-border);
	}
	td {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--doku-surface-border);
		vertical-align: top;
		color: var(--doku-text-muted);
	}

	code {
		background: var(--doku-code-bg);
		border-radius: 3px;
		padding: 0.1em 0.4em;
		font-size: 0.82em;
		font-family: 'Fira Mono', 'Consolas', monospace;
		color: var(--doku-code-color);
	}
	pre {
		background: var(--doku-code-bg);
		border: 1px solid var(--doku-surface-border);
		border-radius: 0.5rem;
		padding: 1rem 1.25rem;
		overflow-x: auto;
		font-size: 0.85rem;
		font-family: 'Fira Mono', 'Consolas', monospace;
		line-height: 1.6;
		color: var(--doku-pre-color);
		margin-bottom: 1rem;
	}

	.callout {
		background: var(--doku-callout-bg);
		border-left: 3px solid var(--doku-callout-border);
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0.75rem 1rem;
		margin: 1rem 0;
		font-size: 0.875rem;
		color: var(--doku-callout-text);
	}
	.callout-warn {
		background: var(--doku-callout-warn-bg);
		border-left-color: var(--doku-callout-warn-border);
		color: var(--doku-callout-warn-text);
	}

	@media (max-width: 768px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.sidebar {
			display: none;
		}
		.content {
			padding: 2rem 1.25rem 4rem;
		}
	}
</style>
