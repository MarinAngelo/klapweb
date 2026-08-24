<script lang="ts">
	import { onMount } from 'svelte';

	interface TocEntry {
		id: string;
		text: string;
		level: number;
		group: string;
	}
	let tocEntries: TocEntry[] = [];
	let activeId = '';

	$: navGroups = (['Slices', 'Custom Types', 'Page Types', 'Architektur'] as const).map((g) => ({
		label: g,
		entries: tocEntries.filter((e) => e.group === g)
	}));

	onMount(() => {
		const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
		tocEntries = sections.map((el) => {
			const h2 = el.querySelector('h2');
			const clone = h2?.cloneNode(true) as HTMLElement | undefined;
			clone?.querySelector('.slice-tag')?.remove();
			const id = el.id;
			const group = id.startsWith('ct-')
				? 'Custom Types'
				: id.startsWith('pt-')
					? 'Page Types'
					: id.startsWith('arch-')
						? 'Architektur'
						: 'Slices';
			return { id, text: clone?.textContent?.trim() ?? '', level: 2, group };
		});

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
	<aside class="sidebar">
		<div class="sidebar-inner">
			<a href="/" class="back">← zurück</a>
			<p class="sidebar-label">Inhalt</p>
			<nav>
				{#each navGroups as { label, entries }}
					{#if entries.length > 0}
						<p class="nav-group-label">{label}</p>
						<ul>
							{#each entries as entry}
								<li class:active={entry.id === activeId}>
									<a href="#{entry.id}">{entry.text}</a>
								</li>
							{/each}
						</ul>
					{/if}
				{/each}
			</nav>
		</div>
	</aside>

	<main class="content">
		<header class="page-header">
			<h1>Dev-Dokumentation</h1>
			<p class="subtitle">klap-web · Slices, Komponenten &amp; Architektur</p>
		</header>

		<section id="adresse-und-map">
			<h2>AdresseUndMap <code class="slice-tag">adresse_und_map</code></h2>
			<p>
				Adresstext neben einer eingebetteten Google Maps Karte &mdash; mit automatischem
				Wegbeschreibungs-Link und optionalem Seiten-Toggle.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Adresse / Text</td></tr>
					<tr
						><td><code>map_url</code></td><td>Text</td><td
							>Google Maps URL (goo.gl-Shortlinks werden serverseitig aufgelöst)</td
						></tr
					>
					<tr><td><code>map_height</code></td><td>Zahl</td><td>Kartenhöhe in px</td></tr>
					<tr><td><code>map_left</code></td><td>Toggle</td><td>Karte links, Text rechts</td></tr>
					<tr
						><td><code>text_center_h</code></td><td>Toggle</td><td>Text horizontal zentrieren</td
						></tr
					>
					<tr
						><td><code>text_zoom_desktop</code> / <code>text_zoom_mobile</code></td><td>Zahl</td><td
							>Schriftgrösse Desktop / Mobile (%)</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe</td
						></tr
					>
					<tr><td><code>opacity</code></td><td>Zahl</td><td>Deckkraft der Karte (0–100)</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation (Richtung, Verzögerung ms, Dauer ms)</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Generiert automatisch einen Wegbeschreibungs-Link (<code>google.com/maps/dir/</code>).
				Shortlinks (<code>maps.app.goo.gl</code>) werden via Server-Redirect zu Embed-URLs
				aufgelöst.
			</div>
		</section>

		<section id="akkordeon">
			<h2>Akkordeon <code class="slice-tag">accordion</code></h2>
			<p>
				Ausklappbare FAQ-Liste mit optionaler Volltextsuche. Die <em>leistungen</em>-Variation
				bezieht ihre Einträge aus dem Seiten-Kontext statt aus dem CMS.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">bildUndText</span>
				<span class="pill gate" title="Feature: ecommerce">leistungen &nbsp;⚙</span>
			</div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>heading</code></td><td>Rich Text (Einzel)</td><td>Überschrift</td></tr>
					<tr><td><code>description</code></td><td>Rich Text</td><td>Einleitungstext</td></tr>
					<tr
						><td><code>erstes_item_ausgeklappt</code></td><td>Toggle</td><td
							>Erstes Element standardmässig offen</td
						></tr
					>
					<tr
						><td><code>mit_suche</code> <span class="field-gate">Professional</span></td><td
							>Toggle</td
						><td>Suchfeld aktivieren</td></tr
					>
					<tr
						><td><code>suchfeld_platzhalter</code> <span class="field-gate">Professional</span></td
						><td>Text</td><td>Placeholder im Suchfeld</td></tr
					>
					<tr
						><td><code>sektion_rahmen</code></td><td>Toggle</td><td
							>Rahmen um die gesamte Sektion</td
						></tr
					>
					<tr
						><td
							><code>bg_color</code> / <code>text_color</code> / <code>border_color</code> /
							<code>link_color</code></td
						><td>Farbe</td><td>Hintergrund-, Text-, Rahmen-, Linkfarbe</td></tr
					>
					<tr
						><td><code>contrast_amount</code></td><td>Zahl</td><td
							>Kontrast-Offset für Akkordeon-Titel</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">
				Items <span class="table-label-note">(Wiederholungen: accordion_items)</span>
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>label</code></td><td>Text</td><td>Titel des Eintrags</td></tr>
					<tr><td><code>content</code></td><td>Rich Text</td><td>Inhalt</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Die <code>leistungen</code>-Variation bezieht Einträge aus
				<code>context.pageLeistungen</code>
				&mdash; sie ignoriert die CMS-Items. Farben inkl. automatischem Kontrast-Fallback via
				<code>hexLuminance()</code>
				+ <code>shadeColor()</code>.
			</div>
		</section>

		<section id="anleitung">
			<h2>Anleitung <code class="slice-tag">anleitung</code></h2>
			<p>Nummerierte Schritt-für-Schritt-Anleitung, optional mit YouTube-Video pro Schritt.</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>title</code></td><td>Text</td><td>Titel der Anleitung</td></tr>
					<tr><td><code>description</code></td><td>Rich Text</td><td>Einleitungstext</td></tr>
					<tr><td><code>youtube_video</code></td><td>Embed</td><td>Optionales Gesamt-Video</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Gruppe <span class="table-label-note">(steps)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>step_title</code></td><td>Text</td><td>Schritt-Titel</td></tr>
					<tr><td><code>step_description</code></td><td>Rich Text</td><td>Schritt-Inhalt</td></tr>
					<tr><td><code>youtube_video</code></td><td>Embed</td><td>Optionales Schritt-Video</td></tr
					>
				</tbody>
			</table>
		</section>

		<section id="bild">
			<h2>Bild <code class="slice-tag">image</code></h2>
			<p>
				Bild-Slice mit vier Variationen: einfaches Bild, Vollbild-Banner, Slider-Karussell und
				Vorher/Nachher-Vergleich.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">banner</span>
				<span class="pill">carousel</span>
				<span class="pill">vorherNachher</span>
			</div>
			<p class="table-label">Primary-Felder (default / banner)</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>image</code></td><td>Bild</td><td
							>Hauptbild (+ mobile Thumbnail 1080×1920)</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Primary-Felder (vorherNachher)</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>bild_links</code> / <code>bild_rechts</code></td><td>Bild</td><td
							>Vorher / Nachher</td
						></tr
					>
					<tr
						><td><code>text_links</code> / <code>text_rechts</code></td><td>Text</td><td
							>Beschriftung links / rechts</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(carousel)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>image</code></td><td>Bild</td><td>Karussell-Bild</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Index 0 entfernt automatisch das Top-Padding (erstes Element auf der Seite).
				Sub-Komponenten: <code>carousel.svelte</code>, <code>vorher-nachher.svelte</code>.
			</div>
		</section>

		<section id="button">
			<h2>Button <code class="slice-tag">button</code></h2>
			<p>Einzelne CTA-Schaltfläche mit umfassenden Farb-, Grössen- und Ausrichtungsoptionen.</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill gate" title="Feature: ecommerce">kauf &nbsp;⚙</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>button_link</code></td><td>Link</td><td
							>Ziel-URL (entfällt bei <em>kauf</em>)</td
						></tr
					>
					<tr><td><code>button_text</code></td><td>Text</td><td>Beschriftung</td></tr>
					<tr><td><code>button_size</code></td><td>Auswahl</td><td>Klein / Mittel / Gross</td></tr>
					<tr><td><code>button_align</code></td><td>Auswahl</td><td>Links / Mitte / Rechts</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Mobile: volle Breite</td></tr
					>
					<tr
						><td><code>button_color</code> / <code>button_hover_color</code></td><td>Farbe</td><td
							>Text- &amp; Rahmenfarbe / Hover</td
						></tr
					>
					<tr
						><td><code>button_bg_color</code> / <code>button_hover_bg_color</code></td><td>Farbe</td
						><td>Hintergrundfarbe / Hover</td></tr
					>
					<tr
						><td><code>y_padding</code></td><td>Auswahl</td><td
							>Vertikaler Abstand (kein / wenig / mittel / gross)</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<em>kauf</em>-Variation: Link automatisch via <code>getBeauftragunHref()</code> gesetzt.
				Fallback-Farben aus <code>$theme.pageButton*</code>-Stores.
			</div>
		</section>

		<section id="event">
			<h2>Event <code class="slice-tag">event</code></h2>
			<p>Einzelner Termin mit Datum, Zeit, Ort und automatischem iCalendar-Download (.ics).</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>title</code> / <code>sub_title</code></td><td>Text</td><td
							>Titel / Untertitel</td
						></tr
					>
					<tr><td><code>description</code></td><td>Rich Text</td><td>Beschreibung</td></tr>
					<tr
						><td><code>start_date_time</code> / <code>end_date_time</code></td><td>Datum/Zeit</td
						><td>Start / Ende</td></tr
					>
					<tr><td><code>location_text</code></td><td>Rich Text</td><td>Ortsangabe</td></tr>
					<tr
						><td><code>geopoint</code></td><td>Geo-Punkt</td><td>Koordinaten für Google Maps</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Gruppe <span class="table-label-note">(additional_dates)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>date</code></td><td>Datum</td><td>Zusatz-Datum für Wiederholungstermine</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Datum-Formatierung via <code>Intl.DateTimeFormat('de-CH')</code>. Generiert einen
				<code>.ics</code>-Download-Link (iCalendar) für Kalender-Apps.
			</div>
		</section>

		<section id="formular">
			<h2>Formular <code class="slice-tag">form</code></h2>
			<p>
				Konfigurierbares Kontaktformular mit Netlify-Integration, optionalem Terminbuchungs-Modus
				und Checkout-Weiterleitung.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill gate" title="Feature: terminbuchung">mitTermin &nbsp;⚙</span>
				<span class="pill gate" title="Feature: ecommerce">kauf &nbsp;⚙</span>
			</div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>form_title</code></td><td>Text</td><td>Formular-Titel</td></tr>
					<tr
						><td><code>form_instructions</code></td><td>Rich Text</td><td
							>Instruktionen über dem Formular</td
						></tr
					>
					<tr
						><td><code>submitt_button_text</code></td><td>Text</td><td
							>Senden-Button-Beschriftung</td
						></tr
					>
					<tr
						><td><code>zwei_spalten</code></td><td>Toggle</td><td>Zweispaltiges Felder-Layout</td
						></tr
					>
					<tr
						><td><code>submitted_title</code> / <code>submitted_text</code></td><td
							>Text / Rich Text</td
						><td>Erfolgsmeldung nach dem Absenden</td></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Gruppe <span class="table-label-note">(form_fields)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>field_name</code></td><td>Text</td><td>Feld-Label</td></tr>
					<tr
						><td><code>field_type</code></td><td>Auswahl</td><td
							>Textfeld / E-Mail / Telefon / Textbereich / Auswahlliste / Ankreuzfeld /
							Einzelauswahl / Land</td
						></tr
					>
					<tr><td><code>required</code></td><td>Toggle</td><td>Pflichtfeld</td></tr>
					<tr
						><td><code>invalid_feedback_text</code></td><td>Text</td><td
							>Fehlermeldung bei ungültiger Eingabe</td
						></tr
					>
					<tr
						><td><code>options</code></td><td>Text</td><td
							>Optionen kommagetrennt (für Auswahllisten)</td
						></tr
					>
					<tr><td><code>placeholder</code></td><td>Text</td><td>Platzhaltertext</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Netlify Forms-Integration: <code>form_name</code> wird aus Slice-Index auto-generiert wenn
				leer. Checkout-Modus (<em>kauf</em>): nach Submit Weiterleitung zu <code>checkout_url</code> statt
				Netlify.
			</div>
		</section>

		<section id="galerie">
			<h2>Galerie <code class="slice-tag">galerie</code></h2>
			<p>Bildergalerie als Uniform-Grid oder Masonry-Layout mit Vollbild-Lightbox.</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>title</code></td><td>Rich Text (H2)</td><td>Überschrift (optional)</td></tr>
					<tr><td><code>columns</code></td><td>Auswahl</td><td>Spalten Desktop (2 / 3 / 4)</td></tr>
					<tr
						><td><code>grid_type</code></td><td>Auswahl</td><td>Uniform (gleiche Höhe) / Masonry</td
						></tr
					>
					<tr><td><code>gap</code></td><td>Toggle</td><td>Abstände zwischen Bildern</td></tr>
					<tr><td><code>rounded</code></td><td>Toggle</td><td>Abgerundete Ecken</td></tr>
					<tr><td><code>full_bleed</code></td><td>Toggle</td><td>Randloses Vollbild-Raster</td></tr>
					<tr
						><td><code>banner_overlap</code></td><td>Toggle</td><td>Überlappend mit Kopfzeile</td
						></tr
					>
					<tr
						><td><code>header_bg_opacity</code></td><td>Zahl</td><td
							>Transparenz Kopfzeile (0–100)</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe</td
						></tr
					>
					<tr><td><code>animate</code></td><td>Toggle</td><td>Einblend-Animation</td></tr>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(Bilder)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>image</code></td><td>Bild</td><td>Galerie-Bild</td></tr>
					<tr><td><code>caption</code></td><td>Text</td><td>Bildunterschrift</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Lightbox-Status via <code>isLightboxOpen</code>-Store. <code>banner_overlap</code>:
				<code>BannerThemeSync</code> passt Navbar-Transparenz dynamisch ans Galerie-Banner an.
			</div>
		</section>

		<section id="globale-events">
			<h2>GlobaleEvents <code class="slice-tag">globale_events</code></h2>
			<p>
				Lädt und zeigt alle Kinder-Events einer Event-Serie aus Prismic, mit Registrierungsmodal
				(E-Mail / WhatsApp / Telegram).
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill gate" title="Feature: global_events">ganzer Slice &nbsp;⚙</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>events</code></td><td>Link → event</td><td
							>Eltern-Event / Veranstaltungsreihe</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Kinder-Dokumente werden <strong>client-seitig</strong> via Prismic API geladen (<code
					>onMount</code
				>). Anmelde-Texte aus dem Eltern-Dokument. Registrierungsoptionen als konfigurierbare Links
				(E-Mail-Vorlage, WhatsApp, Telegram).
			</div>
		</section>

		<section id="google-map-einbetten">
			<h2>GoogleMapEinbetten <code class="slice-tag">code_einbetten</code></h2>
			<p>
				Google Maps Karte als iframe &mdash; ohne Adresstextblock, nur die Karte mit optionalem
				Wegbeschreibungs-Button.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>map_url</code></td><td>Text</td><td>Google Maps URL</td></tr>
					<tr><td><code>map_height</code></td><td>Zahl</td><td>Kartenhöhe in px</td></tr>
					<tr><td><code>opacity</code></td><td>Zahl</td><td>Deckkraft (0–100)</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<code>maps.app.goo.gl</code>-Shortlinks werden via Server-Redirect zu Embed-URLs aufgelöst.
				Wegbeschreibungs-Button automatisch generiert.
			</div>
		</section>

		<section id="html-code">
			<h2>HtmlCode <code class="slice-tag">html_code</code></h2>
			<p>
				Einbettung von beliebigem HTML-Code mit automatischer Desinfizierung via <code
					>sanitizeHtml()</code
				>.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>html_code</code></td><td>Rich Text (preformatted)</td><td>HTML-Quelltext</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout callout-warn">
				HTML wird via <code>sanitizeHtml()</code> desinfiziert (gefährliche Tags/Attribute entfernt)
				bevor es via <code>&#123;@html&#125;</code> gerendert wird. CSS-Variable
				<code>--hr-color</code>
				steuert <code>&lt;hr&gt;</code>-Farbe.
			</div>
		</section>

		<section id="inhaltsverzeichnis">
			<h2>Inhaltsverzeichnis <code class="slice-tag">inhaltsverzeichnis</code></h2>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill gate" title="Plan: professional">ab Professional &nbsp;&#9650;</span>
			</div>
			<p>
				Seitenweites Inhaltsverzeichnis das alle H2/H3-Überschriften der Seite via DOM-Scan
				aggregiert &mdash; unabhängig davon, in welchem Slice sie sich befinden. Kein eigener
				Inhalt, nur Navigation.
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>title</code></td><td>Text</td><td>Bezeichnung (Default: «Inhalt»)</td></tr>
					<tr><td><code>tiefe</code></td><td>Auswahl</td><td>Nur H2 / H2 und H3</td></tr>
					<tr
						><td><code>ausrichtung</code></td><td>Auswahl</td><td
							>Oben (horizontale Leiste) / Links (Fixed Sidebar)</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Desktop-Hintergrund- / Textfarbe</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<strong>onMount:</strong> Scannt <code>main h2, main h3</code>, setzt fehlende IDs via
				<code>toSlug()</code>, baut <code>tocGroups[]</code>.<br />
				<strong>Oben:</strong> Horizontale Flex-Leiste mit gruppierten H2-Spalten + H3-Einrückung.<br
				/>
				<strong>Links:</strong> <code>position: fixed</code> Sidebar, ×-Button mit Auto-Reappear
				nach 80px Scroll-Delta.<br />
				<strong>Mobile:</strong> <code>position: fixed</code> Bottom-Sheet mit
				<code>IntersectionObserver</code>; Farben aus <code>$theme.headerBgColor</code> /
				<code>headerColor</code>.
			</div>
		</section>

		<section id="kacheln">
			<h2>Kacheln <code class="slice-tag">image_cards</code></h2>
			<p>
				Karten-Grid mit Bild, Text und optionalem Button. Unterstützt E-Commerce-Preisdarstellung in
				der <em>plaene</em>-Variation.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill gate" title="Feature: ecommerce">plaene &nbsp;⚙</span>
			</div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>heading</code></td><td>Rich Text (H2)</td><td>Überschrift</td></tr>
					<tr><td><code>grid_columns</code></td><td>Auswahl</td><td>Spalten (2 / 3)</td></tr>
					<tr><td><code>round_corners</code></td><td>Toggle</td><td>Abgerundete Ecken</td></tr>
					<tr
						><td><code>component_body_color</code> / <code>component_body_bg_color</code></td><td
							>Farbe</td
						><td>Sektion-Schrift / -Hintergrund</td></tr
					>
					<tr
						><td><code>body_color</code> / <code>body_bg_color</code></td><td>Farbe</td><td
							>Kachel-Schrift / -Hintergrund</td
						></tr
					>
					<tr
						><td
							><code>button_color</code> / <code>button_hover_color</code> /
							<code>button_bg_color</code>
							/ <code>button_hover_bg_color</code></td
						><td>Farbe</td><td>Schaltflächen-Farben</td></tr
					>
					<tr><td><code>border_color</code></td><td>Farbe</td><td>Rahmenfarbe der Kacheln</td></tr>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation (Stagger 150ms)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(Kacheln)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>image</code></td><td>Bild</td><td>Kachel-Bild</td></tr>
					<tr
						><td><code>image_overlay_color</code> / <code>image_overlay_opacity</code></td><td
							>Farbe / Zahl</td
						><td>Bild-Überlagerung</td></tr
					>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Kachel-Text</td></tr>
					<tr
						><td><code>buttonLink</code> / <code>buttonText</code></td><td>Link / Text</td><td
							>Schaltflächen-Link / -Beschriftung</td
						></tr
					>
				</tbody>
			</table>
		</section>

		<section id="p5-grafik">
			<h2>P5Grafik <code class="slice-tag">p5_grafik</code></h2>
			<p>Interaktive generative Grafiken via p5.js, frei wählbar aus vordefinierten Sketches.</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">mitTitelbereich</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>sketch_name</code></td><td>Auswahl</td><td
							>Sketch-Preset (Orbital Circles / Particle Flow / …)</td
						></tr
					>
					<tr
						><td><code>hintergrundfarbe</code></td><td>Farbe</td><td>Canvas-Hintergrundfarbe</td
						></tr
					>
					<tr><td><code>color</code></td><td>Farbe</td><td>Vordergrundfarbe</td></tr>
					<tr><td><code>image</code></td><td>Bild</td><td>Bild-Input für den Sketch</td></tr>
					<tr><td colspan="3">Nur <em>mitTitelbereich</em>:</td></tr>
					<tr
						><td
							><code>banner_overlap</code> / <code>header_bg_opacity</code> /
							<code>hide_header_on_load</code></td
						><td>Toggle / Zahl / Toggle</td><td
							>Banner-Überlappung / Navbar-Transparenz / Kopfzeile ausblenden</td
						></tr
					>
					<tr><td><code>banner_height</code></td><td>Auswahl</td><td>100% / 50% / 33%</td></tr>
					<tr
						><td><code>overlay_color</code> / <code>overlay_opacity</code></td><td>Farbe / Zahl</td
						><td>Überlagerung über Canvas</td></tr
					>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Text über dem Canvas</td></tr>
					<tr
						><td><code>preset_font</code></td><td>Auswahl</td><td
							>Schriftart (Inter / Roboto / …)</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Sketch-Parameter werden reaktiv übergeben &mdash; kein Re-Init beim Ändern von Farben.
				Sub-Komponente <code>P5Canvas.svelte</code>.
			</div>
		</section>

		<section id="preisaufstellung">
			<h2>Preisaufstellung <code class="slice-tag">preisaufstellung</code></h2>
			<p>
				Zeigt eine Preisaufschlüsselung (Preis, Rabatt, Anzahlung, Restbetrag) aus dem <code
					>$variables</code
				>-Store &mdash; für die Konfigurations-/Beauftragungsseite.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>label_preis</code></td><td>Text</td><td>Bezeichnung Gesamtpreis</td></tr>
					<tr><td><code>label_rabatt</code></td><td>Text</td><td>Bezeichnung Rabatt</td></tr>
					<tr><td><code>label_anzahlung</code></td><td>Text</td><td>Bezeichnung Anzahlung</td></tr>
					<tr><td><code>label_restbetrag</code></td><td>Text</td><td>Bezeichnung Restbetrag</td></tr
					>
					<tr
						><td><code>label_abrechnungsart</code></td><td>Text</td><td
							>Bezeichnung Abrechnungsart</td
						></tr
					>
					<tr><td><code>label_total</code></td><td>Text</td><td>Bezeichnung Total</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Zeilen werden nur angezeigt wenn der zugehörige Token im <code>$variables</code>-Store
				belegt ist. Billing-Type-Suffix (Einmalig / pro Jahr / pro Monat) automatisch aus Store.
			</div>
		</section>

		<section id="preisvergleich">
			<h2>Preisvergleich <code class="slice-tag">preisvergleich</code></h2>
			<p>
				Vergleichstabelle für bis zu drei Pläne mit Preisen, Leistungsmerkmalen und optionaler
				Plan-Hervorhebung.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>titel</code></td><td>Rich Text (H2)</td><td>Überschrift</td></tr>
					<tr
						><td><code>plan_1</code> / <code>plan_2</code> / <code>plan_3</code></td><td
							>Link → page</td
						><td>Verknüpfte Plan-Seiten</td></tr
					>
					<tr
						><td><code>hervorhebung</code></td><td>Auswahl</td><td
							>Keiner / Plan 1 / Plan 2 / Plan 3</td
						></tr
					>
					<tr><td><code>cta_label</code></td><td>Text</td><td>CTA-Button-Beschriftung</td></tr>
					<tr><td><code>button_style</code></td><td>Auswahl</td><td>Button-Stil</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(Leistungszeilen)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>leistung</code></td><td>Link → leistung</td><td>Leistungsdokument</td></tr>
					<tr
						><td><code>plan_1_wert</code> / <code>plan_2_wert</code> / <code>plan_3_wert</code></td
						><td>Text</td><td>Wert je Plan (z.B. ✓ / –)</td></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Preisdaten aus verlinkten Page-Dokumenten (<code>ecommerce_price_chf</code>,
				<code>discount</code>, <code>deposit</code>). Währungsumrechnung via
				<code>currencySelection</code>-Store.
			</div>
		</section>

		<section id="stimmen">
			<h2>Stimmen <code class="slice-tag">stimmen</code></h2>
			<p>
				Horizontaler Testimonial-Slider mit Foto, Name, Rolle und Zitat &mdash; ohne externe
				Slider-Library.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>title</code></td><td>Rich Text (H2)</td><td>Überschrift</td></tr>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe</td
						></tr
					>
					<tr><td><code>card_bg_color</code></td><td>Farbe</td><td>Karten-Hintergrundfarbe</td></tr>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(Testimonials)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>quote</code></td><td>Rich Text (Paragraph)</td><td>Zitat</td></tr>
					<tr><td><code>author</code></td><td>Text</td><td>Name</td></tr>
					<tr><td><code>role</code></td><td>Text</td><td>Rolle / Unternehmen</td></tr>
					<tr><td><code>avatar</code></td><td>Bild</td><td>Portrait-Foto (optional)</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Slider via CSS <code>transform: translateX</code>. Kartenbreite adaptiv: Mobile =
				Container-Breite, sm = 320px, ≥768px = 384px. <code>card_bg_color</code> Fallback via
				<code>color-mix()</code>.
			</div>
		</section>

		<section id="text">
			<h2>Text <code class="slice-tag">text</code></h2>
			<p>
				Rich-Text-Block mit optionalem Zweispalten-Layout. Unterstützt spezielle Labels: <code
					>highlight</code
				>, <code>note</code>, <code>quote</code>, <code>invisible</code>.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">twoColumns</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>text</code></td><td>Rich Text</td><td
							>Inhalt (unterstützt Labels: highlight / note / quote / invisible)</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe (cascadiert in Kind-Elemente via Inline-Style)</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<code>twoColumns</code>: CSS <code>columns-2 gap-16</code> ab md.
				<code>rt-invisible</code>-Label: Schriftfarbe = Hintergrundfarbe (unsichtbarer Text). Farben
				werden als <code>--page-color</code> / <code>--page-bg-color</code> Inline-Style gesetzt.
			</div>
		</section>

		<section id="text-and-cta">
			<h2>TextAndCta <code class="slice-tag">text_and_cta</code></h2>
			<p>
				Vollbild-fähige Text-Sektion mit integrierter CTA-Schaltfläche und optionalem Scroll-Snap.
			</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>label</code></td><td>Text</td><td
							>Kleines Label über dem Titel (z.B. «Über uns»)</td
						></tr
					>
					<tr><td><code>text_align</code></td><td>Auswahl</td><td>Links / Mitte / Rechts</td></tr>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Inhalt</td></tr>
					<tr><td><code>fullscreen_height</code></td><td>Toggle</td><td>Höhe = 100vh</td></tr>
					<tr
						><td><code>scroll_snap</code></td><td>Toggle</td><td
							>Scroll-Snap-Einrasten aktivieren</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>text_color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe</td
						></tr
					>
					<tr
						><td><code>text_zoom_desktop</code> / <code>text_zoom_mobile</code></td><td>Zahl</td><td
							>Schriftgrösse Desktop / Mobile (%)</td
						></tr
					>
					<tr
						><td><code>button_link</code> / <code>button_text</code></td><td>Link / Text</td><td
							>Schaltfläche</td
						></tr
					>
					<tr
						><td><code>button_size</code> / <code>button_align</code></td><td>Auswahl</td><td
							>Grösse / Ausrichtung</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td
							>Mobile: Schaltfläche volle Breite</td
						></tr
					>
					<tr
						><td
							><code>button_color</code> / <code>button_hover_color</code> /
							<code>button_bg_color</code>
							/ <code>button_hover_bg_color</code></td
						><td>Farbe</td><td>Schaltflächen-Farben</td></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Schriftgrössen-Scaling: <code>font-size: calc(1em * zoom / 100)</code>. Button-Link kann auf
				Beauftragungsseite zeigen via <code>getBeauftragunHref()</code>.
			</div>
		</section>

		<section id="text-mit-bild">
			<h2>TextMitBild <code class="slice-tag">text_with_image</code></h2>
			<p>Zweispaltiger Text-Bild-Block, optional als Vollbild-Sektion.</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">standardBildLinks</span>
				<span class="pill">withButton</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Inhalt</td></tr>
					<tr
						><td><code>image</code></td><td>Bild</td><td
							>Bild (rechts bei default, links bei standardBildLinks)</td
						></tr
					>
					<tr
						><td><code>bg_color</code> / <code>color</code></td><td>Farbe</td><td
							>Hintergrund- / Schriftfarbe</td
						></tr
					>
					<tr><td><code>image_round</code></td><td>Toggle</td><td>Bild als Kreis</td></tr>
					<tr
						><td><code>fullscreen</code></td><td>Toggle</td><td
							>Höhe = <code>calc(100vh - headerHeight)</code></td
						></tr
					>
					<tr
						><td><code>text_center_v</code> / <code>text_center_h</code></td><td>Toggle</td><td
							>Text vertikal / horizontal zentrieren</td
						></tr
					>
					<tr><td><code>y_padding_same</code></td><td>Toggle</td><td>Abstand oben = unten</td></tr>
					<tr
						><td><code>y_padding</code></td><td>Auswahl</td><td
							>Vertikaler Abstand (kein / wenig / mittel / gross)</td
						></tr
					>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
					<tr><td colspan="3">Nur <em>withButton</em>:</td></tr>
					<tr
						><td><code>buttonLink</code> / <code>buttonText</code></td><td>Link / Text</td><td
							>Schaltfläche</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Layout via Sub-Komponente <code>ImageTextGrid.svelte</code>. <code>fullscreen</code>: Höhe =
				<code>calc(100vh - headerHeight px)</code>
				via <code>$headerHeight</code>-Store.
			</div>
		</section>

		<section id="timeline">
			<h2>Timeline <code class="slice-tag">timeline</code></h2>
			<p>Vertikale Chronologie mit Datum, Titel, Untertitel und Beschreibung pro Eintrag.</p>
			<div class="pills"><span class="pill">default</span></div>
			<p class="table-label">Primary-Felder</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>title</code></td><td>Rich Text (H2)</td><td>Überschrift</td></tr>
					<tr
						><td><code>bg_color</code> / <code>color</code> / <code>line_color</code></td><td
							>Farbe</td
						><td>Hintergrund- / Text- / Linienfarbe</td></tr
					>
					<tr><td><code>animate</code></td><td>Toggle</td><td>Einblend-Animation</td></tr>
				</tbody>
			</table>
			<p class="table-label">Items <span class="table-label-note">(Einträge)</span></p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>date</code></td><td>Text</td><td>Datum / Jahr</td></tr>
					<tr><td><code>title</code></td><td>Text</td><td>Titel</td></tr>
					<tr><td><code>subtitle</code></td><td>Text</td><td>Untertitel</td></tr>
					<tr><td><code>description</code></td><td>Rich Text</td><td>Beschreibung</td></tr>
				</tbody>
			</table>
			<div class="callout">
				Vertikale Linie links (Mobile) / zentriert (Desktop). Stagger-Einblend-Animation: 100ms
				Verzögerung pro Eintrag, 1200ms Dauer.
			</div>
		</section>

		<section id="titelbereich">
			<h2>Titelbereich <code class="slice-tag">hero</code></h2>
			<p>
				Banner-Slice mit Hintergrundbild, Farbverlauf, Overlay, optialem Text/Button und
				Karussell-Unterstützung.
			</p>
			<div class="pills">
				<span class="pill">default</span>
				<span class="pill">+ Karussell-Variationen</span>
			</div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>banner_overlap</code></td><td>Toggle</td><td
							>Kopfzeile überlappt das Banner</td
						></tr
					>
					<tr
						><td><code>header_bg_opacity</code></td><td>Zahl</td><td>Navbar-Transparenz (0–100)</td
						></tr
					>
					<tr
						><td><code>hide_header_on_load</code></td><td>Toggle</td><td
							>Kopfzeile beim Laden ausblenden</td
						></tr
					>
					<tr><td><code>banner_height</code></td><td>Auswahl</td><td>100% / 50% / 33%</td></tr>
					<tr
						><td><code>backgroundImage</code></td><td>Bild</td><td
							>Hintergrundbild (+ mobile Thumbnail)</td
						></tr
					>
					<tr><td><code>bg_color</code></td><td>Farbe</td><td>Fallback Hintergrundfarbe</td></tr>
					<tr
						><td
							><code>gradient_color_1</code> / <code>gradient_stop_1</code> /
							<code>gradient_opacity_1</code></td
						><td>Farbe / Zahl / Zahl</td><td>Verlauf Startfarbe</td></tr
					>
					<tr
						><td
							><code>gradient_color_2</code> / <code>gradient_stop_2</code> /
							<code>gradient_opacity_2</code></td
						><td>Farbe / Zahl / Zahl</td><td>Verlauf Endfarbe</td></tr
					>
					<tr
						><td><code>gradient_type</code> / <code>gradient_angle</code></td><td>Auswahl</td><td
							>Linear / Radial; Winkel 0°–315°</td
						></tr
					>
					<tr
						><td><code>overlay_color</code> / <code>overlay_opacity</code></td><td>Farbe / Zahl</td
						><td>Bild-Überlagerungsfarbe</td></tr
					>
					<tr><td><code>text</code></td><td>Rich Text</td><td>Banner-Text</td></tr>
					<tr><td><code>color</code></td><td>Farbe</td><td>Schriftfarbe</td></tr>
					<tr
						><td><code>preset_font</code> / <code>font</code></td><td>Auswahl / Link → font</td><td
							>Schriftart-Preset / eigenes Font-Dokument</td
						></tr
					>
					<tr
						><td><code>button_link</code> / <code>button_text</code></td><td>Link / Text</td><td
							>Schaltfläche</td
						></tr
					>
					<tr
						><td
							><code>button_color</code> / <code>button_hover_color</code> /
							<code>button_bg_color</code>
							/ <code>button_hover_bg_color</code></td
						><td>Farbe</td><td>Schaltflächen-Farben</td></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<code>BannerThemeSync</code> passt Navbar-Transparenz dynamisch ans Banner an. Dynamisches
				Font-Loading (Preset + eigenes Font-Dokument via Link). Sub-Komponenten:
				<code>GradientBackground</code>, <code>ImageCarousel</code>,
				<code>ImageCarouselMobile</code>.
			</div>
		</section>

		<section id="zitat">
			<h2>Zitat <code class="slice-tag">quote</code></h2>
			<p>Typografisch gesetztes Blockzitat mit optionaler Quellenangabe.</p>
			<div class="pills"><span class="pill">default</span></div>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>quote</code></td><td>Rich Text (Einzel)</td><td>Zitattext</td></tr>
					<tr><td><code>source</code></td><td>Text</td><td>Quelle / Autor (optional)</td></tr>
					<tr
						><td><code>mobile_full_width</code></td><td>Toggle</td><td>Vollbreite auf Mobile</td
						></tr
					>
					<tr
						><td><code>animate</code> / <code>anim_*</code></td><td>Toggle / Auswahl / Zahl</td><td
							>Einblend-Animation</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				<code>&lt;blockquote&gt;</code> + <code>&lt;figcaption&gt;</code> mit typografischen Anführungszeichen.
				Ohne Quelle: zentriert; mit Quelle: linksbündig mit «—»-Trennzeichen.
			</div>
		</section>

		<div class="section-divider">Custom Types</div>

		<section id="ct-settings">
			<h2>Einstellungen <code class="slice-tag">settings</code></h2>
			<p>
				Singleton (nicht-repeatable). Globale Website-Konfiguration: Texte für
				Impressum/AGB/Datenschutz, SEO-Defaults, Passwort, Sprache und PWA.
			</p>
			<p class="table-label">Tab: Main</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>site_title</code></td><td>Rich Text (H1)</td><td>Website-Titel</td></tr>
					<tr
						><td><code>site_sub_title</code></td><td>Rich Text (H2)</td><td>Website-Untertitel</td
						></tr
					>
					<tr
						><td><code>responsible_person_company</code></td><td>Text</td><td
							>Verantwortliche Person / Unternehmen</td
						></tr
					>
					<tr
						><td><code>company_identification_number</code></td><td>Text</td><td
							>Unternehmenskennnummer</td
						></tr
					>
					<tr
						><td><code>responsible_address</code></td><td>Rich Text</td><td
							>Verantwortliche Adresse</td
						></tr
					>
					<tr
						><td><code>responsible_email</code></td><td>Text</td><td>Verantwortliche E-Mail</td></tr
					>
					<tr><td><code>e_mail</code></td><td>Text</td><td>Korrespondenz-E-Mail</td></tr>
					<tr
						><td><code>privacy_policy</code></td><td>Rich Text</td><td>Datenschutzerklärung</td></tr
					>
					<tr><td><code>legal_disclosure</code></td><td>Rich Text</td><td>Impressum</td></tr>
					<tr><td><code>agb</code></td><td>Rich Text</td><td>AGB</td></tr>
					<tr><td><code>cookies_text</code></td><td>Rich Text</td><td>Cookie-Hinweis</td></tr>
					<tr
						><td><code>page_password</code></td><td>Text</td><td
							>Passwort für passwortgeschützte Seiten und <code>/login</code></td
						></tr
					>
					<tr
						><td><code>show_language_switcher</code></td><td>Toggle</td><td
							>Mehrsprachigkeit aktivieren</td
						></tr
					>
					<tr
						><td><code>home_redirect_active</code></td><td>Toggle</td><td
							>Startseiten-Weiterleitung aktiv</td
						></tr
					>
					<tr
						><td><code>home_redirect_url</code></td><td>Link → page</td><td
							>Zielseite für Startseiten-Weiterleitung</td
						></tr
					>
					<tr
						><td><code>contacts</code></td><td>Gruppe</td><td
							>Kontaktpersonen für Impressum (impressum, title, name, email, website, address)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: SEO</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>domain</code></td><td>Text</td><td
							>Domain der Website (für Sitemap und og:url)</td
						></tr
					>
					<tr
						><td><code>site_name</code></td><td>Text</td><td
							>Website-Name für &lt;meta og:site_name&gt;</td
						></tr
					>
					<tr
						><td><code>meta_title</code></td><td>Text</td><td>Globaler SEO-Titel (Fallback)</td></tr
					>
					<tr
						><td><code>meta_description</code></td><td>Rich Text</td><td
							>Globale SEO-Beschreibung</td
						></tr
					>
					<tr
						><td><code>meta_image</code></td><td>Bild (1200×630)</td><td
							>Standard Open Graph Bild</td
						></tr
					>
					<tr
						><td><code>adobe_font_id</code></td><td>Text</td><td
							>Adobe Fonts Project-ID (lädt Typekit-Script)</td
						></tr
					>
					<tr><td><code>favicon</code></td><td>Bild (32×32)</td><td>Favicon</td></tr>
					<tr
						><td><code>pwa_enabled</code> <span class="field-gate">Individuell</span></td><td
							>Toggle</td
						><td>Als App installierbar (PWA)</td></tr
					>
					<tr
						><td><code>pwa_name</code> <span class="field-gate">Individuell</span></td><td>Text</td
						><td>App-Name</td></tr
					>
					<tr
						><td><code>pwa_short_name</code> <span class="field-gate">Individuell</span></td><td
							>Text</td
						><td>App-Kurzname</td></tr
					>
					<tr
						><td><code>pwa_theme_color</code> <span class="field-gate">Individuell</span></td><td
							>Farbe</td
						><td>App Theme-Farbe (Browser-Chrome)</td></tr
					>
					<tr
						><td><code>pwa_icon</code> <span class="field-gate">Individuell</span></td><td
							>Bild (512×512)</td
						><td>App-Icon (Thumbnail 192×192)</td></tr
					>
				</tbody>
			</table>
		</section>

		<section id="ct-theme">
			<h2>Design Vorlage <code class="slice-tag">theme</code></h2>
			<p>
				Repeatable. Definiert das visuelle Erscheinungsbild der Website: Farben, Schriften,
				Button-Stile, Header und Footer. Genau ein Dokument sollte <code>activ: true</code> sein.
			</p>
			<p class="table-label">Tab: Generell</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>activ</code></td><td>Toggle</td><td>Dieses Theme aktivieren</td></tr>
					<tr><td><code>theme_name</code></td><td>Text</td><td>Bezeichnung</td></tr>
					<tr><td><code>uid</code></td><td>UID</td><td>Slug</td></tr>
					<tr><td><code>page_color</code></td><td>Farbe</td><td>Globale Schriftfarbe</td></tr>
					<tr><td><code>page_bg_color</code></td><td>Farbe</td><td>Globale Hintergrundfarbe</td></tr
					>
					<tr
						><td><code>page_font</code></td><td>Link → font</td><td
							>Hauptschrift (eigenes Font-Dokument)</td
						></tr
					>
					<tr
						><td><code>preset_font</code></td><td>Auswahl</td><td
							>Vorinstallierte Hauptschrift (Inter, Roboto, Open Sans, …)</td
						></tr
					>
					<tr
						><td><code>base_font_size_mobile</code> / <code>base_font_size_desktop</code></td><td
							>Auswahl</td
						><td>Basis-Schriftgrösse Mobile / Desktop</td></tr
					>
					<tr
						><td><code>p_font_offset_mobile</code> / <code>p_font_offset_desktop</code></td><td
							>Zahl</td
						><td>Absatz-Schriftgrössen-Offset in px</td></tr
					>
					<tr
						><td><code>container_width</code></td><td>Auswahl</td><td
							>Container-Breite (Schmal … Sehr weit)</td
						></tr
					>
					<tr
						><td><code>page_link_color</code> / <code>page_link_hover_color</code></td><td>Farbe</td
						><td>Linkfarbe / Hover</td></tr
					>
					<tr
						><td><code>page_button_color</code> / <code>page_button_bg_color</code></td><td
							>Farbe</td
						><td>Button-Schrift / -Hintergrund</td></tr
					>
					<tr
						><td><code>page_button_hover_color</code> / <code>page_button_hover_bg_color</code></td
						><td>Farbe</td><td>Button-Schrift / -Hintergrund (Hover)</td></tr
					>
					<tr
						><td><code>svg_icons</code></td><td>Gruppe</td><td
							>SVG-Icons (label, svg_code, image) — referenzierbar in Slices via <code
								>SvgIcons.svelte</code
							></td
						></tr
					>
					<tr
						><td><code>button_stile</code></td><td>Gruppe</td><td
							>Benannte Button-Stile (label, color, bg_color, hover_color, hover_bg_color, icon) —
							Slugs müssen mit <code>gating.json button_stile</code> übereinstimmen</td
						></tr
					>
					<tr
						><td><code>heading_opacity</code></td><td>Zahl</td><td>Titel-Deckkraft in % (0–100)</td
						></tr
					>
					<tr
						><td><code>heading_animation</code></td><td>Toggle</td><td
							>Globale Titel-Einblend-Animation</td
						></tr
					>
					<tr
						><td><code>favicon</code></td><td>Bild</td><td
							>Favicon (überschreibt <code>settings.favicon</code>)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: Kopfzeile</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>full_screen_width</code></td><td>Toggle</td><td
							>Volle Bildschirmbreite nutzen</td
						></tr
					>
					<tr
						><td><code>site_title_font_size</code> / <code>site_sub_title_font_size</code></td><td
							>Zahl</td
						><td>Schriftgrösse Titel / Untertitel in px</td></tr
					>
					<tr
						><td><code>site_title_font</code></td><td>Link → font</td><td
							>Eigene Schriftart für Website-Titel</td
						></tr
					>
					<tr><td><code>logo</code></td><td>Bild</td><td>Logo</td></tr>
					<tr><td><code>logo_height</code></td><td>Zahl</td><td>Logo-Höhe in px</td></tr>
					<tr
						><td><code>logo_color</code></td><td>Farbe</td><td>Logo-Farbe (nur bei SVG-Logos)</td
						></tr
					>
					<tr
						><td><code>header_bg_color</code></td><td>Farbe</td><td>Header-Hintergrundfarbe</td></tr
					>
					<tr><td><code>header_color</code></td><td>Farbe</td><td>Header-Schriftfarbe</td></tr>
					<tr
						><td><code>header_link_color</code> / <code>header_link_hover_color</code></td><td
							>Farbe</td
						><td>Nav-Linkfarbe / Hover</td></tr
					>
					<tr
						><td><code>header_link_font_size</code></td><td>Zahl</td><td
							>Nav-Link-Schriftgrösse in px</td
						></tr
					>
					<tr
						><td><code>header_link_font</code></td><td>Link → font</td><td
							>Schriftart für Nav-Links</td
						></tr
					>
					<tr><td><code>sticky_header</code></td><td>Toggle</td><td>Header fixiert (Sticky)</td></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: Fusszeile</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>footer_bg_color</code></td><td>Farbe</td><td>Footer-Hintergrundfarbe</td></tr
					>
					<tr><td><code>footer_color</code></td><td>Farbe</td><td>Footer-Schriftfarbe</td></tr>
					<tr
						><td><code>footer_font_size_top_bar</code></td><td>Zahl</td><td
							>Textgrösse obere Fusszeile in px</td
						></tr
					>
					<tr
						><td><code>footer_font_size_button_bar</code></td><td>Zahl</td><td
							>Textgrösse untere Fusszeile in px</td
						></tr
					>
					<tr
						><td><code>footer_link_color</code> / <code>footer_link_hover_color</code></td><td
							>Farbe</td
						><td>Footer-Linkfarbe / Hover</td></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Das aktive Theme wird via <code>+layout.server.ts</code> geladen und in den
				<code>theme</code>-Store geschrieben. <code>themeUpdater.ts</code> setzt CSS Custom
				Properties auf <code>&lt;html&gt;</code>. Button-Stile werden aus
				<code>gating.json button_stile</code> + Theme-Gruppe zusammengeführt.
			</div>
		</section>

		<section id="ct-navigation">
			<h2>Navigation <code class="slice-tag">navigation</code></h2>
			<p>
				Singleton. Definiert alle Nav-Links für Hauptnavigation und Footer. Die Struktur erlaubt
				Haupt- und Untermenüs über <code>sub_link</code> und <code>dropdown_link</code>.
			</p>
			<p class="table-label">Gruppe: links</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>label</code></td><td>Rich Text (H3)</td><td>Link-Beschriftung</td></tr>
					<tr><td><code>link</code></td><td>Link</td><td>Ziel-URL oder Prismic-Dokument</td></tr>
					<tr
						><td><code>sub_link</code></td><td>Text</td><td
							>Untermenü-Zugehörigkeit: Label des übergeordneten Eintrags</td
						></tr
					>
					<tr
						><td><code>dropdown_link</code></td><td>Toggle</td><td
							>Als ausklappbare Schaltfläche rendern</td
						></tr
					>
					<tr><td><code>main_nav</code></td><td>Toggle</td><td>In Hauptnavigation anzeigen</td></tr>
					<tr
						><td><code>footer_sec_nav</code></td><td>Toggle</td><td
							>In sekundärer Fusszeilen-Navigation anzeigen</td
						></tr
					>
				</tbody>
			</table>
		</section>

		<section id="ct-font">
			<h2>Schrift <code class="slice-tag">font</code></h2>
			<p>
				Repeatable. Referenzierbare Schriftart-Dokumente, die in Theme und Slices via Link-Feld
				eingebunden werden können.
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>uid</code></td><td>UID</td><td>Slug</td></tr>
					<tr><td><code>name</code></td><td>Text</td><td>Name der Schrift</td></tr>
					<tr
						><td><code>provider</code></td><td>Auswahl</td><td>Anbieter: Google / Adobe / Lokal</td
						></tr
					>
					<tr
						><td><code>variants</code></td><td>Text</td><td
							>Varianten für Google Fonts (z.B. <code>400,700</code>)</td
						></tr
					>
				</tbody>
			</table>
		</section>

		<section id="ct-event">
			<h2>Event <code class="slice-tag">event</code></h2>
			<div class="pills">
				<span class="pill gate" title="Feature: global_events">Feature: global_events &nbsp;⚙</span>
			</div>
			<p>
				Repeatable. Veranstaltungsdokument mit Datum, Ort, Tickets und Wiederholungslogik. Wird vom <em
					>GlobaleEvents</em
				>-Slice und der <em>Event</em>-Slice abgefragt.
			</p>
			<p class="table-label">Tab: Allgemein</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>uid</code></td><td>UID</td><td>URL-Slug</td></tr>
					<tr><td><code>title</code></td><td>Text</td><td>Titel</td></tr>
					<tr><td><code>subtitle</code></td><td>Text</td><td>Untertitel</td></tr>
					<tr><td><code>description</code></td><td>Rich Text</td><td>Kurzbeschreibung</td></tr>
					<tr
						><td><code>image</code></td><td>Bild</td><td
							>Hauptbild (Thumbnails: Quadrat 800×800, Portrait 800×1200)</td
						></tr
					>
					<tr><td><code>featured</code></td><td>Toggle</td><td>Hervorgehoben</td></tr>
					<tr
						><td><code>status</code></td><td>Auswahl</td><td
							>Kein / Geplant / Bestätigt / Abgesagt / Verschoben / Ausgebucht</td
						></tr
					>
					<tr><td><code>slices</code></td><td>Slice Zone</td><td>Detailinhalt</td></tr>
				</tbody>
			</table>
			<p class="table-label">Tab: Datum &amp; Zeit</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>start_date</code></td><td>Timestamp</td><td>Beginn (Datum + Uhrzeit)</td></tr
					>
					<tr><td><code>end_date</code></td><td>Timestamp</td><td>Ende (Datum + Uhrzeit)</td></tr>
					<tr><td><code>all_day</code></td><td>Toggle</td><td>Ganztägig</td></tr>
					<tr><td><code>doors_open</code></td><td>Text</td><td>Einlass ab</td></tr>
					<tr
						><td><code>timezone</code></td><td>Auswahl</td><td
							>Zeitzone (Europe/Zurich, Berlin, Vienna, UTC)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: Ort</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>online_event</code></td><td>Toggle</td><td>Online-Veranstaltung</td></tr>
					<tr><td><code>online_url</code></td><td>Link</td><td>Online-Link / Stream-URL</td></tr>
					<tr
						><td><code>location_name</code></td><td>Text</td><td>Veranstaltungsort / Bezeichnung</td
						></tr
					>
					<tr><td><code>location_room</code></td><td>Text</td><td>Raum / Saal</td></tr>
					<tr
						><td><code>location_address</code></td><td>Text</td><td>Strasse &amp; Hausnummer</td
						></tr
					>
					<tr
						><td><code>location_zip</code> / <code>location_city</code></td><td>Text</td><td
							>PLZ / Ort</td
						></tr
					>
					<tr
						><td><code>location_country</code></td><td>Auswahl</td><td
							>Land (CH / DE / AT / LI / Sonstiges)</td
						></tr
					>
					<tr><td><code>location_map_url</code></td><td>Link</td><td>Google Maps URL</td></tr>
				</tbody>
			</table>
			<p class="table-label">Tab: Details</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>event_type</code></td><td>Auswahl</td><td
							>Veranstaltungsart (Konzert, Workshop, Messe, …)</td
						></tr
					>
					<tr
						><td><code>event_language</code></td><td>Auswahl</td><td>Sprache der Veranstaltung</td
						></tr
					>
					<tr><td><code>target_audience</code></td><td>Text</td><td>Zielgruppe</td></tr>
					<tr><td><code>min_age</code></td><td>Zahl</td><td>Mindestalter</td></tr>
					<tr><td><code>organizer</code></td><td>Text</td><td>Veranstalter</td></tr>
					<tr><td><code>organizer_url</code></td><td>Link</td><td>Veranstalter-Website</td></tr>
					<tr
						><td><code>contact_email</code> / <code>contact_phone</code></td><td>Text</td><td
							>Kontakt E-Mail / Telefon</td
						></tr
					>
					<tr><td><code>accessibility_info</code></td><td>Text</td><td>Barrierefreiheit</td></tr>
					<tr><td><code>additional_info</code></td><td>Rich Text</td><td>Weitere Hinweise</td></tr>
				</tbody>
			</table>
			<p class="table-label">Tab: Tickets &amp; Anmeldung</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>is_free</code></td><td>Toggle</td><td>Kostenlos</td></tr>
					<tr><td><code>price_text</code></td><td>Rich Text</td><td>Preis (Freitext)</td></tr>
					<tr><td><code>ticket_url</code></td><td>Link</td><td>Ticket-Link / Anmeldung</td></tr>
					<tr
						><td><code>registration_required</code></td><td>Toggle</td><td
							>Anmeldung erforderlich</td
						></tr
					>
					<tr><td><code>registration_deadline</code></td><td>Datum</td><td>Anmeldeschluss</td></tr>
					<tr
						><td><code>max_participants</code> / <code>min_participants</code></td><td>Zahl</td><td
							>Max. / Min. Teilnehmerzahl</td
						></tr
					>
					<tr><td><code>registration_email</code></td><td>Text</td><td>Anmeldung per E-Mail</td></tr
					>
					<tr
						><td><code>registration_whatsapp</code></td><td>Text</td><td>Anmeldung per WhatsApp</td
						></tr
					>
					<tr
						><td><code>registration_telegram</code></td><td>Text</td><td>Anmeldung per Telegram</td
						></tr
					>
					<tr
						><td><code>registration_text_all</code></td><td>Text</td><td
							>Anmeldetext (alle Termine)</td
						></tr
					>
					<tr
						><td><code>registration_text_single</code></td><td>Text</td><td
							>Anmeldetext (Einzeltermin)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: Serie &amp; Wiederholung</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>is_series</code></td><td>Toggle</td><td>Veranstaltungsserie</td></tr>
					<tr><td><code>series_name</code></td><td>Text</td><td>Serienname</td></tr>
					<tr
						><td><code>recurrence</code></td><td>Auswahl</td><td
							>Wiederholungsrhythmus (Einmalig / Täglich / Wöchentlich / Zweiwöchentlich / Monatlich
							/ Jährlich / Unregelmässig)</td
						></tr
					>
					<tr><td><code>recurrence_days</code></td><td>Text</td><td>Wochentag(e)</td></tr>
					<tr><td><code>series_end_date</code></td><td>Datum</td><td>Serienende</td></tr>
					<tr><td><code>series_total_count</code></td><td>Zahl</td><td>Anzahl Termine</td></tr>
					<tr><td><code>series_exceptions</code></td><td>Text</td><td>Ausnahmen / Ausfälle</td></tr>
					<tr
						><td><code>parent_event</code></td><td>Link → event</td><td
							>Übergeordnetes Event / Serie</td
						></tr
					>
					<tr><td><code>individually_bookable</code></td><td>Toggle</td><td>Einzeln buchbar</td></tr
					>
					<tr
						><td><code>individual_is_free</code></td><td>Toggle</td><td>Einzeltermin kostenlos</td
						></tr
					>
					<tr
						><td><code>individual_price_text</code></td><td>Rich Text</td><td>Einzeltermin Preis</td
						></tr
					>
					<tr
						><td><code>individual_ticket_url</code></td><td>Link</td><td
							>Einzeltermin Ticket-Link</td
						></tr
					>
					<tr
						><td><code>individual_registration_email</code></td><td>Text</td><td
							>Einzeltermin Anmeldung per E-Mail</td
						></tr
					>
					<tr
						><td><code>individual_registration_whatsapp</code></td><td>Text</td><td
							>Einzeltermin Anmeldung per WhatsApp</td
						></tr
					>
					<tr
						><td><code>individual_registration_telegram</code></td><td>Text</td><td
							>Einzeltermin Anmeldung per Telegram</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: SEO</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>meta_title</code></td><td>Text</td><td>SEO-Titel</td></tr>
					<tr><td><code>meta_description</code></td><td>Text</td><td>SEO-Beschreibung</td></tr>
					<tr><td><code>meta_image</code></td><td>Bild (1200×630)</td><td>Open Graph Bild</td></tr>
				</tbody>
			</table>
		</section>

		<section id="ct-terminplanung">
			<h2>Terminplanung <code class="slice-tag">terminplanung</code></h2>
			<div class="pills">
				<span class="pill gate" title="Feature: terminbuchung">Feature: terminbuchung &nbsp;⚙</span>
			</div>
			<p>
				Repeatable. Einzelne Terminslots für das Buchungssystem. Unterstützt Wiederholungen (täglich
				bis monatlich).
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>uid</code></td><td>UID</td><td>Slug</td></tr>
					<tr><td><code>titel</code></td><td>Text</td><td>Bezeichnung des Termins</td></tr>
					<tr><td><code>datum</code></td><td>Datum</td><td>Startdatum</td></tr>
					<tr><td><code>uhrzeit</code></td><td>Text</td><td>Uhrzeit im Format HH:MM</td></tr>
					<tr><td><code>session_laenge</code></td><td>Zahl</td><td>Dauer in Minuten</td></tr>
					<tr
						><td><code>zeitzone</code></td><td>Auswahl</td><td
							>Zeitzone (24 Optionen, Default: Europe/Zurich)</td
						></tr
					>
					<tr
						><td><code>wiederholung</code></td><td>Auswahl</td><td
							>Keine / Täglich / Wöchentlich / Zweiwöchentlich / Monatlich</td
						></tr
					>
					<tr
						><td><code>wiederholung_bis</code></td><td>Datum</td><td>Wiederholen bis (Datum)</td
						></tr
					>
					<tr
						><td><code>wiederholung_anzahl</code></td><td>Zahl</td><td
							>Maximale Anzahl Wiederholungen</td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Die Slot-Expansion wird serverseitig in <code>src/lib/server/terminSlots.ts</code> durchgeführt
				— Wiederholungen werden zur Laufzeit aus dem Startdatum berechnet, nicht einzeln gespeichert.
			</div>
		</section>

		<section id="ct-leistung">
			<h2>Leistung <code class="slice-tag">leistung</code></h2>
			<div class="pills">
				<span class="pill gate" title="Feature: ecommerce">Feature: ecommerce &nbsp;⚙</span>
			</div>
			<p>
				Repeatable. Referenzierbare Leistungs-/Produkt-Einträge für E-Commerce-Funktionen (z.B. <em
					>Akkordeon leistungen</em
				>, <em>Kacheln plaene</em>).
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>uid</code></td><td>UID</td><td>Slug</td></tr>
					<tr><td><code>label</code></td><td>Text</td><td>Bezeichnung der Leistung</td></tr>
					<tr><td><code>beschreibung</code></td><td>Rich Text</td><td>Beschreibung</td></tr>
				</tbody>
			</table>
		</section>

		<section id="ct-variablen">
			<h2>Variablen <code class="slice-tag">variablen</code></h2>
			<div class="pills">
				<span class="pill gate" title="Feature: variablen">Feature: variablen &nbsp;⚙</span>
			</div>
			<p>
				Singleton. Key-Value-Store für wiederverwendbare Texte und Konfigurationswerte, die in
				Slices via Token referenziert werden können.
			</p>
			<p class="table-label">Gruppe: eintraege</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>schluessel</code></td><td>Text</td><td>Token-Name (Schlüssel)</td></tr>
					<tr><td><code>wert</code></td><td>Text</td><td>Wert</td></tr>
				</tbody>
			</table>
		</section>

		<div class="section-divider">Page Types</div>

		<section id="pt-page">
			<h2>Page <code class="slice-tag">page</code></h2>
			<p>
				Repeatable. Zentraler Inhaltstyp für alle Seiten. Enthält eine Slice Zone sowie
				Einstellungen für Erscheinungsbild, SEO und Zugriffsschutz.
			</p>
			<p class="table-label">Tab: Main</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>uid</code></td><td>UID</td><td>URL-Pfad der Seite</td></tr>
					<tr
						><td><code>title</code></td><td>Rich Text (H1)</td><td
							>Seitentitel (wird im &lt;title&gt;-Tag und Breadcrumb genutzt)</td
						></tr
					>
					<tr
						><td><code>slices</code></td><td>Slice Zone</td><td
							>Inhalt der Seite — alle verfügbaren Slices</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: Erscheinungsbild</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>page_bg_color</code></td><td>Farbe</td><td
							>Hintergrundfarbe (überschreibt globale Theme-Farbe)</td
						></tr
					>
					<tr
						><td><code>page_color</code></td><td>Farbe</td><td
							>Schriftfarbe (überschreibt globale Theme-Farbe)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">Tab: SEO &amp; Metadata</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>meta_title</code></td><td>Text</td><td
							>SEO-Titel (überschreibt globalen Titel)</td
						></tr
					>
					<tr><td><code>meta_description</code></td><td>Text</td><td>SEO-Beschreibung</td></tr>
					<tr
						><td><code>meta_image</code></td><td>Bild (2400×1260)</td><td
							>Open Graph / Social-Bild</td
						></tr
					>
					<tr
						><td><code>no_index</code></td><td>Toggle</td><td
							>Seite von Suchmaschinen ausschliessen</td
						></tr
					>
					<tr
						><td><code>landing_page</code></td><td>Toggle</td><td>Header und Footer ausblenden</td
						></tr
					>
					<tr
						><td><code>password_protected</code></td><td>Toggle</td><td
							>Seite mit Passwort schützen (nutzt <code>settings.page_password</code>)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">
				Tab: Online-Handel <span style="font-size:0.8em;opacity:0.6;"
					>(Feature: ecommerce · Plan: individuell)</span
				>
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>ecommerce_active</code></td><td>Toggle</td><td
							>E-Commerce für diese Seite aktivieren</td
						></tr
					>
					<tr
						><td><code>ecommerce_price_chf</code></td><td>Number</td><td
							>Preis exkl. MwSt. in CHF</td
						></tr
					>
					<tr
						><td><code>ecommerce_deposit_percent</code></td><td>Number</td><td
							>Anzahlungs-Prozentsatz (überschreibt globalen Settings-Wert)</td
						></tr
					>
					<tr
						><td><code>ecommerce_discount_percent</code></td><td>Number</td><td
							>Rabatt-Prozentsatz (überschreibt Discount-Codes)</td
						></tr
					>
					<tr
						><td><code>ecommerce_billing_type</code></td><td>Select</td><td
							>Abrechnungsart: <code>Einmalig</code> / <code>Jährlich</code> /
							<code>Monatlich</code></td
						></tr
					>
					<tr
						><td><code>ecommerce_stripe_url</code></td><td>Link</td><td
							>Stripe Hosted Checkout URL (<code>https://buy.stripe.com/…</code>)</td
						></tr
					>
				</tbody>
			</table>
			<p class="table-label">
				Tab: Leistungen <span style="font-size:0.8em;opacity:0.6;"
					>(Feature: ecommerce · Plan: individuell)</span
				>
			</p>
			<table>
				<thead><tr><th>API-ID</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>ecommerce_addons</code></td><td>Group</td><td
							>Zusatzleistungen: Liste von <code>addon_page</code>-Links (Beziehung zu einer anderen
							<code>page</code>). Werden auf der Zusammenfassung-Seite als Addon-Optionen angezeigt.</td
						></tr
					>
					<tr
						><td><code>leistungen</code></td><td>Group</td><td
							>Leistungsübersicht: jedes Item hat <code>leistung</code> (Relation zu
							<code>leistung</code>-Custom-Type) + <code>wert</code> (Text, z.B. <code>✓</code> oder
							<em>bis 5 Produkte</em>). Wird im Preisvergleich-Slice genutzt.</td
						></tr
					>
				</tbody>
			</table>
		</section>

		<div class="section-divider">Architektur</div>

		<section id="arch-i18n">
			<h2>Mehrsprachigkeit (i18n)</h2>
			<p>
				Sprachumschaltung via URL-Präfix. Die Standard-Sprache erscheint ohne Präfix (<code>/</code
				>), weitere Sprachen mit Präfix (<code>/en-us/</code> usw.). Sprachen werden dynamisch aus Prismic
				gelesen &mdash; keine hartcodierte Liste im Code.
			</p>

			<p class="table-label">Beteiligte Dateien</p>
			<table>
				<thead><tr><th>Datei</th><th>Rolle</th></tr></thead>
				<tbody>
					<tr
						><td><code>src/lib/i18n/i18n.ts</code></td><td
							>Zentrale Konfiguration: <code>isLanguage()</code>, <code>staticRoutes</code>,
							<code>getLangBase()</code></td
						></tr
					>
					<tr
						><td><code>src/lib/i18n/translations.ts</code></td><td
							>Alle Übersetzungs-Keys + <code>t()</code>-Hilfsfunktion</td
						></tr
					>
					<tr
						><td><code>src/lib/stores/i18n.ts</code></td><td
							>Svelte-Store <code>$_</code> — reaktiver Wrapper um <code>t()</code></td
						></tr
					>
					<tr
						><td><code>src/params/lang.ts</code></td><td
							>SvelteKit-Matcher für <code>[[lang=lang]]</code>-Route; akzeptiert
							<code>xx-xx</code>-Format</td
						></tr
					>
					<tr
						><td><code>src/lib/components/LanguageSwitcher.svelte</code></td><td
							>UI-Komponente für Sprachwechsel; zeigt alle aktiven Locales</td
						></tr
					>
					<tr
						><td><code>src/routes/+layout.server.ts</code></td><td
							>Sprach-Ermittlung aus URL, Prismic-Abfragen pro Sprache, liefert <code>lang</code>
							und <code>locales</code></td
						></tr
					>
					<tr
						><td><code>src/routes/+layout.svelte</code></td><td
							><code>allAlternates</code>-Berechnung,
							<code>&lt;link rel="alternate" hreflang&gt;</code>-Tags</td
						></tr
					>
					<tr
						><td><code>src/lib/prismicio.ts</code></td><td
							>Route-Resolver mit <code>/:lang?/:uid</code> für Link-Auflösung</td
						></tr
					>
					<tr
						><td><code>src/routes/[[lang=lang]]/</code></td><td
							>Alle mehrsprachigen Seiten; <code>[[lang=lang]]</code> macht den Sprachcode optional</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Ablauf der Sprach-Ermittlung (Layout Server)</p>
			<table>
				<thead><tr><th>Schritt</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td>1</td><td
							>Prismic <code>getRepository()</code> liefert <code>mainLang</code> +
							<code>allLocales</code> (5-Minuten-Cache)</td
						></tr
					>
					<tr><td>2</td><td>Erstes URL-Segment wird gegen bekannte Locale-Codes geprüft</td></tr>
					<tr
						><td>3</td><td
							>Match → dieser Code = <code>lang</code>; kein Match →
							<code>params.lang || mainLang</code></td
						></tr
					>
					<tr
						><td>4</td><td
							><code>lang</code> steht allen Kind-Routen als <code>data.lang</code> zur Verfügung</td
						></tr
					>
					<tr
						><td>5</td><td
							>Wenn <code>show_language_switcher</code> deaktiviert → 404 für Nicht-Master-Sprachen</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Der <code>$_</code>-Store</p>
			<table>
				<thead><tr><th>Aspekt</th><th>Detail</th></tr></thead>
				<tbody>
					<tr
						><td>Definition</td><td
							><code>derived(page, ($page) =&gt; (key) =&gt; t(key, $page.data.lang))</code></td
						></tr
					>
					<tr
						><td>Import</td><td><code>import &#123; _ &#125; from '$lib/stores/i18n'</code></td></tr
					>
					<tr
						><td>Verwendung</td><td
							><code>&#123;$_('Schlüssel')&#125;</code> — Key ist immer der deutsche Text</td
						></tr
					>
					<tr
						><td>Fallback-Kette</td><td
							>1. Exakter Sprach-Basis-Match (<code>en</code> → <code>en-us</code>) &nbsp;2.
							<code>de-ch</code> &nbsp;3. Key selbst</td
						></tr
					>
					<tr
						><td>SSR</td><td
							>Im Server-Code: <code>t(key, lang)</code> direkt aus <code>translations.ts</code> importieren</td
						></tr
					>
					<tr
						><td>Neuer Key</td><td
							>Erst in <code>translations.ts</code> eintragen (mind. <code>de-ch</code> +
							<code>en-us</code>), dann verwenden</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Statische Routen (<code>i18n.ts staticRoutes</code>)</p>
			<table>
				<thead><tr><th>Route</th><th>de</th><th>en</th></tr></thead>
				<tbody>
					<tr
						><td>impressum</td><td><code>impressum</code></td><td><code>legal-notice</code></td></tr
					>
					<tr
						><td>datenschutz</td><td><code>datenschutzerklaerung</code></td><td
							><code>privacy-policy</code></td
						></tr
					>
					<tr><td>agb</td><td><code>agb</code></td><td><code>terms-and-conditions</code></td></tr>
				</tbody>
			</table>

			<p class="table-label">LanguageSwitcher — Props</p>
			<table>
				<thead><tr><th>Prop</th><th>Quelle</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>locales</code></td><td><code>data.locales</code></td><td
							>Alle verfügbaren Locale-Codes aus Prismic</td
						></tr
					>
					<tr
						><td><code>lang</code></td><td><code>data.lang</code></td><td>Aktuell aktive Sprache</td
						></tr
					>
					<tr
						><td><code>allAlternates</code></td><td>Layout-Berechnung</td><td
							>Vorberechnete Ziel-URLs aus Prismic <code>alternate_languages</code></td
						></tr
					>
				</tbody>
			</table>
			<div class="callout">
				Prismic-Abfragen immer mit <code>&#123; lang &#125;</code>:
				<code>client.getSingle('settings', &#123; lang &#125;)</code>. Sprachunabhängige Dokumente
				(Theme, Fonts) mit <code>&#123; lang: '*' &#125;</code>. Das SEO-Tag
				<code>&lt;link rel="alternate" hreflang="x-default"&gt;</code> zeigt auf die Master-Sprache.
			</div>
		</section>

		<section id="arch-buildscript">
			<h2>Build-Script <code class="slice-tag">scripts/build-customtypes.js</code></h2>
			<p>
				Wird automatisch bei <code>npm run dev</code> und <code>npm run build</code> ausgeführt.
				Liest <code>gating.json</code> + <code>slicemachine.config.json</code> und generiert alle gitignorierten
				Output-Dateien. Kein manueller Aufruf nötig.
			</p>

			<p class="table-label">Input-Dateien</p>
			<table>
				<thead><tr><th>Datei</th><th>Rolle</th></tr></thead>
				<tbody>
					<tr
						><td><code>slicemachine.config.json</code> → <code>plan</code></td><td
							>Aktiver Plan (<code>basis</code> / <code>professional</code> /
							<code>individuell</code>)</td
						></tr
					>
					<tr
						><td><code>gating.json</code></td><td
							>Pläne, Features, Slice-/Field-/Variation-Gates, Icons, Button-Stile</td
						></tr
					>
					<tr
						><td><code>customtypes/*/base.json</code></td><td
							>Versionierte Custom-Type-Basis für <code>page</code> und <code>settings</code></td
						></tr
					>
					<tr
						><td><code>customtypes/_features/*/page.json</code> usw.</td><td
							>Tab-Overlays für Custom Types — werden bei aktivem Feature eingehängt</td
						></tr
					>
					<tr
						><td><code>customtypes/_features/*/customtypes/*/index.json</code></td><td
							>Feature-eigene Custom Types (event, terminplanung, leistung, variablen)</td
						></tr
					>
					<tr
						><td><code>src/lib/slices/*/base.json</code></td><td
							>Basis-Slice-Definition (gemeinsame Variationen)</td
						></tr
					>
					<tr
						><td><code>src/lib/slices/*/full.json</code></td><td
							>Slice mit Extra-Variationen (für Feature-/Plan-Gates)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Output-Dateien (gitignored, generiert)</p>
			<table>
				<thead><tr><th>Datei</th><th>Inhalt</th></tr></thead>
				<tbody>
					<tr
						><td><code>customtypes/*/index.json</code></td><td
							>Fertiges Prismic-Custom-Type-Schema</td
						></tr
					>
					<tr
						><td><code>src/lib/slices/*/model.json</code></td><td>Fertiges Slice-Machine-Modell</td
						></tr
					>
					<tr
						><td><code>src/lib/config/icon-labels.ts</code></td><td
							>Label→Slug-Mapping für SVG-Icons (<code>ICON_SLUG_BY_LABEL</code>)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Schritte (Ausführungsreihenfolge)</p>
			<table>
				<thead><tr><th>#</th><th>Schritt</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td>1</td><td><strong>Plan-Chain auflösen</strong></td><td
							><code>activePlanChain</code> = aktueller Plan + alle Eltern via <code>extends</code>.
							<code>individuell</code>
							→ <code>[individuell, professional, basis]</code></td
						></tr
					>
					<tr
						><td>2</td><td><strong>Aktive Features bestimmen</strong></td><td
							>Features aus <code>gating.features</code>, deren <code>plans[]</code> sich mit
							<code>activePlanChain</code> überschneiden</td
						></tr
					>
					<tr
						><td>3</td><td><strong>Warncheck base.json</strong></td><td
							>Vergleicht Slice-Choices in <code>page/index.json</code> vs. <code>base.json</code> — warnt
							bei fehlenden Einträgen</td
						></tr
					>
					<tr
						><td>4</td><td><strong>Custom Types generieren</strong></td><td
							><code>page/index.json</code> + <code>settings/index.json</code> aus
							<code>base.json</code> + aktiven Feature-Overlays zusammensetzen</td
						></tr
					>
					<tr
						><td>5</td><td><strong>button_style-Optionen patchen</strong></td><td
							>Alle <code>full.json</code>/<code>model.json</code> mit
							<code>button_style</code>-Select-Feld auf aktuelle
							<code>gating.json button_stile</code>-Labels aktualisieren</td
						></tr
					>
					<tr
						><td>6</td><td><strong>Slice Models generieren</strong></td><td
							>Pro Slice: <code>base.json</code> + aktive Extra-Variationen aus
							<code>full.json</code>
							zusammenführen, Felder/Variationen gaten → <code>model.json</code></td
						></tr
					>
					<tr
						><td>7</td><td><strong>Feature-Custom-Types kopieren</strong></td><td
							>Feature-eigene Custom Types aus <code>_features/*/customtypes/</code> nach
							<code>customtypes/*/index.json</code> kopieren</td
						></tr
					>
					<tr
						><td>8</td><td><strong>Inaktive Custom Types aufräumen</strong></td><td
							><code>index.json</code> entfernen für Custom Types dessen Plan/Feature inaktiv ist</td
						></tr
					>
					<tr
						><td>9</td><td><strong>Theme Icon-Optionen + icon-labels.ts</strong></td><td
							>Icon-Labels aus <code>gating.icons</code> in
							<code>theme/index.json → button_stile.icon</code>
							schreiben; <code>icon-labels.ts</code> generieren</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Gating-Ebenen (gating.json)</p>
			<table>
				<thead><tr><th>Ebene</th><th>Schlüssel</th><th>Effekt wenn inaktiv</th></tr></thead>
				<tbody>
					<tr
						><td>Slice</td><td><code>slices.&#123;Name&#125;.plan</code> / <code>.feature</code></td
						><td><code>model.json</code> wird nicht generiert</td></tr
					>
					<tr
						><td>Variation</td><td
							><code>slices.&#123;Name&#125;.variations.&#123;id&#125;</code></td
						><td>Variation fehlt in <code>model.json</code></td></tr
					>
					<tr
						><td>Feld</td><td><code>slices.&#123;Name&#125;.fields.&#123;key&#125;</code></td><td
							>Feld fehlt in allen Variationen</td
						></tr
					>
					<tr
						><td>Custom Type</td><td><code>customTypes.&#123;typeId&#125;.plan/feature</code></td
						><td><code>index.json</code> wird gelöscht</td></tr
					>
					<tr
						><td>CT-Feld</td><td
							><code>customTypes.&#123;typeId&#125;.fields.&#123;key&#125;</code></td
						><td>Feld fehlt im generierten Schema</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Sicherheitsmerkmale</p>
			<table>
				<thead><tr><th>Mechanismus</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>writeIfChanged()</code></td><td
							>Schreibt <code>model.json</code> nur bei echter Änderung — verhindert unnötige Slice Machine
							Reloads</td
						></tr
					>
					<tr
						><td>Pflicht-Tabs-Check</td><td
							>Bricht mit <code>process.exit(1)</code> ab wenn <code>theme/index.json</code> die Tabs
							Generell/Kopfzeile/Fusszeile verloren hat</td
						></tr
					>
					<tr
						><td>Feature-Typ-Check</td><td
							>Bricht ab wenn eine aktive Feature-Custom-Type-Basisdatei fehlt</td
						></tr
					>
					<tr
						><td><code>full.json</code> Sync</td><td
							>Synchronisiert Basis-Variationen-Primaries von <code>base.json</code> →
							<code>full.json</code> um Divergenz zu verhindern</td
						></tr
					>
					<tr
						><td>Warnung base.json</td><td
							>Warnt wenn <code>page/index.json</code> Slice-Choices hat die in
							<code>base.json</code> fehlen (würden bei nächstem Build verloren gehen)</td
						></tr
					>
					<tr
						><td>Warnung kein base.json</td><td
							>Warnt wenn ein Slice-Verzeichnis existiert aber kein <code>base.json</code> hat — Slice
							wird nicht generiert und fehlt im Writing Room</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Planänderung:</strong> <code>slicemachine.config.json</code> → <code>plan</code>
				ändern → <code>npm run dev</code> → neue <code>model.json</code> + <code>index.json</code>
				werden generiert → <code>slicemachine push</code> überträgt die Schemas nach Prismic.
			</div>
			<div class="callout callout-warn">
				<strong>Neuer Slice:</strong> Nach dem Anlegen in der Slice Machine UI muss
				<code>customtypes/page/base.json</code> manuell um den Slice-Choice ergänzt werden — sonst fehlt
				er nach dem nächsten Build in allen anderen Branches.
			</div>
			<div class="callout callout-warn">
				<strong>Merge-Risiko base.json:</strong> Slices die noch kein <code>base.json</code> haben
				(Altbestand), verlieren bei einem Merge ihr committed <code>model.json</code> sobald der
				neue Gitignore-Glob <code>src/lib/slices/*/model.json</code> greift. Der Build meldet dann
				eine ⚠-Warnung. Lösung: <code>base.json</code> aus Git-History restaurieren mit
				<code
					>git show &lt;pre-merge-commit&gt;:src/lib/slices/SliceName/model.json &gt;
					src/lib/slices/SliceName/base.json</code
				>.
			</div>
		</section>

		<div class="section-divider">Online-Handel</div>

		<section id="arch-ecommerce">
			<h2>E-Commerce / Online-Handel <code class="slice-tag">arch-ecommerce</code></h2>
			<p>
				Drei-Schritt-Checkout (<code>/beauftragung</code> →
				<code>/beauftragung/zusammenfassung</code>
				→ <code>/beauftragung/bestaetigung</code>) mit drei Zahlungswegen (Stripe, Rechnung, Bar),
				PDF-Rechnungsgenerierung, E-Mail-Versand über Resend und Kundendatenspeicherung via Netlify
				Blobs.
			</p>

			<p class="table-label">Beteiligte Dateien</p>
			<table>
				<thead><tr><th>Pfad</th><th>Rolle</th></tr></thead>
				<tbody>
					<tr
						><td
							><code>src/routes/[[lang=lang]]/beauftragung/+page.server.ts</code> /
							<code>+page.svelte</code></td
						><td>Schritt 1 — Formular (Rechnungsadresse + Extra-Felder)</td></tr
					>
					<tr
						><td
							><code>src/routes/[[lang=lang]]/beauftragung/zusammenfassung/+page.server.ts</code> /
							<code>+page.svelte</code>
							/ <code>+page.js</code></td
						><td>Schritt 2 — Preisübersicht, Addon-Auswahl, Zahlungsart, Rabatt-Code</td></tr
					>
					<tr
						><td
							><code>src/routes/[[lang=lang]]/beauftragung/bestaetigung/+page.server.ts</code> /
							<code>+page.svelte</code></td
						><td>Schritt 3 — Bestätigungsseite mit konfigurierbarem Text</td></tr
					>
					<tr
						><td><code>src/routes/api/invoice/+server.ts</code></td><td
							>PDF-Rechnung generieren (pdf-lib) + 2 E-Mails senden + Kundendaten speichern</td
						></tr
					>
					<tr
						><td><code>src/routes/api/save-customer/+server.ts</code></td><td
							>Kundendaten für Bar-Zahlung in Netlify Blobs speichern</td
						></tr
					>
					<tr
						><td><code>src/routes/api/validate-code/+server.ts</code></td><td
							>Rabatt-Code gegen Prismic-Liste prüfen</td
						></tr
					>
					<tr
						><td><code>src/routes/api/form/+server.ts</code></td><td
							>Netlify-Forms Fallback (lokal — gibt immer 200 zurück)</td
						></tr
					>
					<tr
						><td><code>src/lib/server/customers.ts</code></td><td
							>Netlify Blobs Store <code>kunden</code></td
						></tr
					>
					<tr
						><td><code>src/lib/server/bookings.ts</code></td><td
							>Netlify Blobs Stores <code>buchungen</code> + <code>cancelled_termine</code></td
						></tr
					>
					<tr
						><td><code>src/lib/pricing.ts</code></td><td
							>Preisberechnung, Formatierung, <code>calcDisplayPrice()</code></td
						></tr
					>
					<tr
						><td><code>src/lib/utils/exchangeRates.server.ts</code></td><td
							>Wechselkurse von <code>open.er-api.com</code> (kein API-Key)</td
						></tr
					>
					<tr
						><td><code>static/netlify-forms.html</code></td><td
							>Netlify-Forms Discovery-Sentinel für Bar-Zahlung</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Checkout-Schritte</p>
			<table>
				<thead><tr><th>Schritt</th><th>Route</th><th>Was passiert</th></tr></thead>
				<tbody>
					<tr
						><td><strong>1 — Formular</strong></td><td
							><code>/beauftragung?dienstleistung=&lt;uid&gt;</code></td
						><td
							>Rechnungsfelder (Name, Adresse, E-Mail, Tel, Land …) + optionale Extra-Felder aus
							Prismic Settings. Daten werden bei Submit in <code>sessionStorage.checkoutData</code> gespeichert.</td
						></tr
					>
					<tr
						><td><strong>2 — Zusammenfassung</strong></td><td
							><code>/beauftragung/zusammenfassung?service=&lt;uid&gt;</code></td
						><td
							>Preis + Addons + Währungsauswahl + Rabatt-Code + AGB-Checkbox + Zahlungsart-Auswahl</td
						></tr
					>
					<tr
						><td><strong>3 — Bestätigung</strong></td><td
							><code>/beauftragung/bestaetigung?method=…</code></td
						><td
							>Prismic-RichText-Bestätigungstext mit <code
								>&#123;&#123;Dienstleistung&#125;&#125;</code
							>-Token, pro Zahlungsart konfigurierbar</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Zahlungswege</p>
			<table>
				<thead><tr><th>Methode</th><th>Ablauf</th><th>Kundensatz gespeichert?</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Rechnung</strong></td><td
							>POST <code>/api/invoice</code> → PDF (pdf-lib) → 2 E-Mails (Resend) → Netlify Blobs
							<code>kunden</code></td
						><td>Ja</td></tr
					>
					<tr
						><td><strong>Bar</strong></td><td
							>POST <code>/api/save-customer</code> → Netlify Blobs <code>kunden</code> + POST zu
							Netlify Forms (<code>beauftragung_bar</code>)</td
						><td>Ja</td></tr
					>
					<tr
						><td><strong>Stripe</strong></td><td
							>Redirect zu Stripe Hosted Checkout (<code>ecommerce_stripe_url</code> aus Prismic +
							<code>?prefilled_email=…</code>). Kein SDK, kein Webhook.</td
						><td>Nein</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">E-Mail-Dienst: Resend</p>
			<table>
				<thead><tr><th>Endpoint</th><th>Auslöser</th><th>E-Mails</th></tr></thead>
				<tbody>
					<tr
						><td><code>/api/invoice</code></td><td>Rechnung-Zahlung</td><td
							>Kunden-Mail (PDF-Anhang) + Geschäfts-Mail (PDF-Anhang)</td
						></tr
					>
					<tr
						><td><code>/api/buche-termin</code></td><td>Terminbuchung</td><td
							>Kunden-Mail (ICS-Anhang) + Anbieter-Mail (ICS-Anhang)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">
				E-Mail-Template-Tokens (<code>&#123;&#123;Token&#125;&#125;</code> in Prismic RichText-Feldern)
			</p>
			<table>
				<thead><tr><th>Token</th><th>Wert</th><th>Kontext</th></tr></thead>
				<tbody>
					<tr
						><td><code>&#123;&#123;Rechnungsnummer&#125;&#125;</code></td><td
							><code>INV-&lt;timestamp&gt;</code></td
						><td>Rechnung</td></tr
					>
					<tr
						><td><code>&#123;&#123;Kundenname&#125;&#125;</code></td><td>Vor- + Nachname</td><td
							>Rechnung</td
						></tr
					>
					<tr
						><td
							><code>&#123;&#123;Vorname&#125;&#125;</code> /
							<code>&#123;&#123;Nachname&#125;&#125;</code></td
						><td>einzeln</td><td>Rechnung</td></tr
					>
					<tr
						><td><code>&#123;&#123;Email&#125;&#125;</code></td><td>Kunden-E-Mail</td><td
							>Rechnung</td
						></tr
					>
					<tr
						><td><code>&#123;&#123;Dienstleistung&#125;&#125;</code></td><td>Produktname</td><td
							>Rechnung</td
						></tr
					>
					<tr
						><td><code>&#123;&#123;Betrag&#125;&#125;</code></td><td
							>formatierter Preis inkl. Währung</td
						><td>Rechnung</td></tr
					>
					<tr
						><td><code>&#123;&#123;Waehrung&#125;&#125;</code></td><td
							>ISO-Code (z.B. <code>CHF</code>)</td
						><td>Rechnung</td></tr
					>
					<tr
						><td><code>&#123;&#123;Firma&#125;&#125;</code></td><td>Unternehmensname des Kunden</td
						><td>Rechnung</td></tr
					>
					<tr
						><td><code>&#123;&#123;Zahlungsfrist&#125;&#125;</code></td><td
							>Zahlungsziel in Tagen</td
						><td>Rechnung</td></tr
					>
					<tr
						><td
							><code>&#123;&#123;Titel&#125;&#125;</code> /
							<code>&#123;&#123;Datum&#125;&#125;</code>
							/ <code>&#123;&#123;Uhrzeit&#125;&#125;</code> /
							<code>&#123;&#123;Dauer&#125;&#125;</code>
							/ <code>&#123;&#123;Name&#125;&#125;</code></td
						><td>Termindetails</td><td>Terminbuchung</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Netlify Blobs — Stores</p>
			<table>
				<thead
					><tr><th>Store-Name</th><th>Key-Format</th><th>Inhalt</th><th>Zugegriff von</th></tr
					></thead
				>
				<tbody>
					<tr
						><td><code>kunden</code></td><td
							><code>&#123;Date.now()&#125;_&#123;randomUUID&#125;</code></td
						><td
							><code>CustomerRecord</code> — alle Kaufdaten (Zahlungsart, Betrag, Adresse, Extra-Felder)</td
						><td><code>/admin/kunden</code></td></tr
					>
					<tr
						><td><code>buchungen</code></td><td
							>Prismic UID (evtl. <code>&lt;uid&gt;_YYYY-MM-DD</code> für Recurring)</td
						><td><code>BookingRecord</code> — Buchungsdetails</td><td
							><code>/admin/buchungen</code></td
						></tr
					>
					<tr
						><td><code>cancelled_termine</code></td><td>Prismic UID</td><td
							><code>&#123; cancelledAt: ISO-String &#125;</code></td
						><td><code>/admin/buchungen</code></td></tr
					>
				</tbody>
			</table>

			<div class="callout callout-warn">
				<strong>Netlify Blobs AutoDetect:</strong> <code>@netlify/blobs</code> v10 erkennt den
				Kontext nicht automatisch mit <code>adapter-auto</code>. <code>NETLIFY_SITE_ID</code> +
				<code>NETLIFY_TOKEN</code>
				müssen immer explizit via <code>$env/dynamic/private</code> übergeben werden.
			</div>

			<p class="table-label">Admin-Panel</p>
			<table>
				<thead><tr><th>Route</th><th>Funktion</th></tr></thead>
				<tbody>
					<tr
						><td><code>/admin</code></td><td
							>Login-Formular — schickt <code>ADMIN_SECRET</code> als Query-Param</td
						></tr
					>
					<tr
						><td><code>/admin/dashboard?secret=…</code></td><td>Links zu Kunden und Buchungen</td
						></tr
					>
					<tr
						><td><code>/admin/kunden?secret=…</code></td><td
							>Tabelle aller Kunden (Datum, Name, E-Mail, Betrag, Zahlungsart-Badge). Action:
							löschen.</td
						></tr
					>
					<tr
						><td><code>/admin/buchungen?secret=…</code></td><td
							>Drei Tabellen: gebuchte Termine / freie Termine / gesperrte Termine. Actions:
							löschen, sperren, entsperren.</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout callout-warn">
				<strong>Authentifizierung Admin:</strong> Nur via
				<code>?secret=ADMIN_SECRET</code>-Query-Parameter — kein Session-Cookie. Das Secret muss bei
				jedem Link mitgegeben werden.
			</div>

			<p class="table-label">Environment-Variablen</p>
			<table>
				<thead><tr><th>Variable</th><th>Zweck</th><th>Pflicht</th><th>Quelle</th></tr></thead>
				<tbody>
					<tr
						><td><code>NETLIFY_SITE_ID</code></td><td>Netlify Blobs Zugriff</td><td>Ja</td><td
							>Netlify → Site Settings → General → Site ID</td
						></tr
					>
					<tr
						><td><code>NETLIFY_TOKEN</code></td><td>Netlify Blobs Zugriff</td><td>Ja</td><td
							>Netlify → User Settings → Applications → Personal Access Tokens (Ablauf: nie)</td
						></tr
					>
					<tr
						><td><code>ADMIN_SECRET</code></td><td>Passwort für <code>/admin</code></td><td>Ja</td
						><td>Beliebiger String</td></tr
					>
					<tr
						><td><code>RESEND_API_KEY</code></td><td>E-Mail-Versand (Rechnungen + Buchungen)</td><td
							>Ja</td
						><td>resend.com Dashboard → API Keys</td></tr
					>
					<tr
						><td><code>INVOICE_FROM_EMAIL</code></td><td>Absender aller transaktionalen Mails</td
						><td>Ja</td><td>Muss verifizierte Domain bei Resend sein</td></tr
					>
					<tr
						><td><code>INVOICE_TO_EMAIL</code></td><td
							>Empfänger der Geschäfts-Benachrichtigungen</td
						><td>Ja</td><td>Beliebige E-Mail-Adresse</td></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Stripe:</strong> Kein SDK installiert, kein Webhook. Nur externer Redirect zu Stripe
				Hosted Checkout (<code>ecommerce_stripe_url</code> aus dem Prismic Page-Dokument der
				Dienstleistung). Kein <code>STRIPE_SECRET_KEY</code> nötig.
			</div>
		</section>

		<div class="section-divider">Klap Studio</div>

		<section id="arch-klapstudio">
			<h2>Klap Studio <code class="slice-tag">KlapStudio.svelte</code></h2>
			<p>
				Visuelles Design-Panel für Live-Colour-Picking direkt auf der gerenderten Seite. Ändert
				Farben, Schriftarten und Gradienten nur im DOM — keine Werte werden gespeichert.
				Kopier-Buttons liefern Hex-Codes, die man dann in Prismic eintragen kann.
			</p>

			<p class="table-label">Aktivierung</p>
			<table>
				<thead><tr><th>Shortcut</th><th>Aktion</th></tr></thead>
				<tbody>
					<tr
						><td><code>Ctrl + Shift + K</code></td><td
							>Panel ein-/ausblenden (togglet <code>studioOpen</code> im Root-Layout)</td
						></tr
					>
					<tr
						><td><code>Alt + Shift + A</code></td><td>Direktnavigation zu <code>/admin</code></td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Panel-Bereiche</p>
			<table>
				<thead><tr><th>Bereich</th><th>Controls</th><th>Scope</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Standard-Schriftart</strong></td><td
							>Schriftwechsel-Button (cycleFont ±1) + Kopier-Button für Fontnamen; Hintergrundfarbe
							(Page); Schriftfarbe; Hintergrundfarbe Slices+ (AN/AUS Toggle)</td
						><td
							>Ganze Seite (<code>--page-bg-color</code>, <code>--page-color</code>,
							<code>--page-font</code>)</td
						></tr
					>
					<tr
						><td><strong>Farbsketch</strong></td><td
							>Modus Dunkel / Hell; P5Canvas-Visualisierung (Maus-X = Hintergrund, Maus-Y = Schrift)</td
						><td>Nur Vorschau — keine DOM-Mutation</td></tr
					>
					<tr
						><td><strong>Slice-Farben</strong></td><td
							>Liste aller Slices auf der Seite (per <code>[data-slice-type]</code>); Auswahl
							aktiviert Slice-spezifische Controls</td
						><td>Einzelner Slice</td></tr
					>
					<tr
						><td><strong>Slice ▸ Farben</strong></td><td
							>Hintergrundfarbe + Schriftfarbe des Slices</td
						><td>Ausgewählter Slice</td></tr
					>
					<tr
						><td><strong>Slice ▸ Schaltfläche</strong></td><td
							>Farbe, Hintergrund, Hover-Farbe, Hover-Hintergrund (nur wenn Slice einen <code
								>.button-prismic-link</code
							> enthält)</td
						><td>Erster Button im Slice</td></tr
					>
					<tr
						><td><strong>Slice ▸ Schriftart</strong></td><td
							>← / → Schriftart-Cycle durch Preset-Fonts (nur <code>hero</code> +
							<code>p5_grafik</code>)</td
						><td>Ausgewählter Slice + Header</td></tr
					>
					<tr
						><td><strong>Slice ▸ Verlauf</strong></td><td
							>Form (Linear/Radial), Richtung (0°–315°), Startfarbe + Deckkraft + Position, Endfarbe
							+ Deckkraft + Position (nur <code>hero</code>)</td
						><td><code>[data-gradient-bg]</code> im Slice</td></tr
					>
					<tr
						><td><strong>Slice ▸ Schriftgrösse</strong></td><td
							>Desktop-Zoom (50–300 %) + Mobile-Zoom (50–300 %) (nur <code>adresse_und_map</code
							>)</td
						><td
							><code>--text-zoom-desktop</code> / <code>--text-zoom-mobile</code> auf
							<code>.text-col</code></td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Technisches Konzept</p>
			<table>
				<thead><tr><th>Aspekt</th><th>Detail</th></tr></thead>
				<tbody>
					<tr
						><td>DOM-Mutation</td><td
							>Nur <code>element.style.setProperty()</code> mit <code>!important</code> — kein Store,
							kein Reaktivitäts-State. Änderungen sind nach Seiten-Navigation weg.</td
						></tr
					>
					<tr
						><td>Restore</td><td
							>Beim Deselektieren eines Slices wird <code>origStyle</code> /
							<code>origInnerStyle</code>
							/ <code>origBtnStyle</code> / <code>origGradientStyle</code> vollständig zurückgeschrieben.</td
						></tr
					>
					<tr
						><td>Slice-Erkennung</td><td
							><code>document.querySelectorAll('[data-slice-type]')</code> — läuft in
							<code>buildSliceList()</code>
							bei jedem Panel-Öffnen (via <code>onMount</code>).</td
						></tr
					>
					<tr
						><td>Gradient-Parsing</td><td
							><code>parseRgba()</code> + Regex auf <code>element.style.background</code> zum Initialisieren
							der Slider-Werte.</td
						></tr
					>
					<tr
						><td>Schriftarten</td><td
							>Preset-Fonts werden lazy als <code>&lt;link&gt;</code>-Tags in
							<code>&lt;head&gt;</code>
							injiziert, nur wenn noch nicht vorhanden. Font-Cycling ändert zusätzlich
							<code>.smart-header</code>
							und alle <code>.logo span</code>-Elemente.</td
						></tr
					>
					<tr
						><td>Einbindung</td><td
							><code>src/routes/+layout.svelte</code> →
							<code>&lt;KlapStudio bind:open=&#123;studioOpen&#125; /&gt;</code>. Shortcut-Listener
							in <code>onMount</code> des Root-Layouts.</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				Klap Studio speichert nichts persistenter. Die Hex-Codes werden per Kopier-Button (<code
					>⧉</code
				>) in die Zwischenablage gelegt — danach müssen sie manuell in Prismic (Theme-Dokument oder
				Page-Felder) eingetragen werden.
			</div>
		</section>

		<section id="arch-admin-rechnungen">
			<h2>Admin: Rechnungsverwaltung <code class="slice-tag">admin/rechnungen</code></h2>
			<p>
				Vollständige Verwaltung von Rechnungen mit automatischer Erstellung aus E-Commerce-Checkouts
				(Rechnung + Bar) und manueller Erfassung. Rechnungen werden in Netlify Blobs gespeichert und
				können editiert, versendet und gelöscht werden.
			</p>

			<p class="table-label">Datenstruktur (ManualInvoiceRecord)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>id</code></td><td>String</td><td
							>Eindeutige Blob-ID: <code>&#36;&#123;Date.now()&#125;_&#36;&#123;uuid&#125;</code
							></td
						></tr
					>
					<tr
						><td><code>invoiceNumber</code></td><td>String</td><td
							>PDF/E-Mail Label: <code>INV-&#36;&#123;timestamp&#125;</code></td
						></tr
					>
					<tr
						><td><code>status</code></td><td>'gespeichert' | 'gesendet'</td><td
							>Versand-Status (automatisch nach E-Mail)</td
						></tr
					>
					<tr
						><td><code>paymentStatus</code></td><td>'offen' | 'bezahlt'</td><td
							>Zahlungs-Status (manuell editierbar im Admin)</td
						></tr
					>
					<tr
						><td><code>paymentMethod</code></td><td>'rechnung' | 'bar'</td><td
							>Herkunft: E-Commerce oder Bar-Zahlung</td
						></tr
					>
					<tr><td><code>date</code></td><td>ISO String</td><td>Erstellungs-Timestamp</td></tr>
					<tr
						><td
							><code>vorname</code>, <code>nachname</code>, <code>firma</code>, <code>email</code>,
							<code>adresse</code>, <code>plz</code>, <code>ort</code>, <code>land</code></td
						><td>String</td><td>Kundendaten</td></tr
					>
					<tr
						><td><code>items</code></td><td>Array</td><td
							>Leistungsposten: &#123;description, quantity, unitPrice&#125;</td
						></tr
					>
					<tr><td><code>notes</code></td><td>String (optional)</td><td>Interne Notizen</td></tr>
					<tr
						><td><code>emailSentAt</code></td><td>ISO String (optional)</td><td
							>Timestamp E-Mail-Versand</td
						></tr
					>
					<tr><td><code>currency</code></td><td>String</td><td>Währung (z.B. 'CHF')</td></tr>
				</tbody>
			</table>

			<p class="table-label">Workflows</p>
			<table>
				<thead><tr><th>Workflow</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Manuelle Rechnung</strong></td><td
							>Kunde aus Dropdown wählen (oder inline "Neuer Kunde" erfassen) → Leistungsposten
							eingeben → PDF Vorschau → Speichern ± E-Mail versenden</td
						></tr
					>
					<tr
						><td><strong>E-Commerce Rechnung</strong></td><td
							>Checkout Zahlungsart "Rechnung" → API /api/invoice erstellt automatisch Rechnung +
							Kunde + E-Mail-Versand</td
						></tr
					>
					<tr
						><td><strong>Bar-Zahlung</strong></td><td
							>Checkout Zahlungsart "Bar" → API /api/create-invoice-bar erstellt Rechnung + Kunde
							(keine E-Mail)</td
						></tr
					>
					<tr
						><td><strong>Bearbeiten</strong></td><td
							>Rechnung öffnen → Tab "Bearbeiten" → Kundenangaben / Items / Notizen / Zahlungsstatus
							ändern → Speichern</td
						></tr
					>
					<tr
						><td><strong>PDF generieren</strong></td><td
							>Tab "PDF" → PDF wird live generiert basierend auf aktuellen Daten → herunterladen
							oder E-Mail versenden</td
						></tr
					>
					<tr
						><td><strong>Löschen</strong></td><td
							>Rechnung aus Tabelle entfernen (mit Bestätigung)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Tabs im Detail-Modal</p>
			<table>
				<thead><tr><th>Tab</th><th>Funktion</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Anzeigen</strong></td><td
							>Vorschau der gespeicherten Rechnungsdaten (schreibgeschützt)</td
						></tr
					>
					<tr
						><td><strong>Bearbeiten</strong></td><td
							>Kundenangaben, Leistungsposten (Hinzufügen/Löschen), Notizen und Zahlungsstatus
							ändern</td
						></tr
					>
					<tr
						><td><strong>PDF</strong></td><td
							>PDF-Preview der Rechnung (live-generiert) mit Versand-Optionen</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Status-Bedeutung:</strong> <code>status</code> ('gespeichert' / 'gesendet') ist
				automatisch und zeigt ob E-Mail versendet wurde. <code>paymentStatus</code> ('offen' / 'bezahlt')
				ist manuell editierbar im Admin und zeigt Zahlungs-Status.
			</div>
		</section>

		<section id="arch-admin-kunden">
			<h2>Admin: Kundenverwaltung <code class="slice-tag">admin/kunden</code></h2>
			<p>
				Zentrales Kunden-Management für alle Quellen: E-Commerce Checkouts, manuelle Rechnungen und
				Bar-Zahlungen. Kunden werden automatisch beim Checkout und manuell beim Erstellen von
				Rechnungen erfasst. Duplikat-Prävention verhindert doppelte Einträge.
			</p>

			<p class="table-label">Datenstruktur (Customer)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>date</code></td><td>ISO String</td><td>Erfassungs-Datum</td></tr>
					<tr
						><td><code>vorname</code>, <code>nachname</code></td><td>String</td><td
							>Name (erforderlich)</td
						></tr
					>
					<tr
						><td
							><code>firma</code>, <code>email</code>, <code>adresse</code>, <code>plz</code>,
							<code>ort</code>, <code>land</code></td
						><td>String (optional)</td><td>Kontaktdaten</td></tr
					>
					<tr
						><td><code>paymentMethod</code></td><td>String</td><td
							>Quelle: 'manuell' (Admin) | 'rechnung' (E-Commerce) | 'bar' (E-Commerce)</td
						></tr
					>
					<tr
						><td><code>service</code>, <code>amount</code>, <code>currency</code></td><td
							>String / Number (optional)</td
						><td>Nur für E-Commerce (legacy)</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Workflows</p>
			<table>
				<thead><tr><th>Workflow</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Manuelle Erfassung</strong></td><td
							>Tab "Kunden" → Form ausfüllen → Speichern. Duplikat-Prüfung (E-Mail primär, Name
							fallback) verhindert Mehrfacherfassung.</td
						></tr
					>
					<tr
						><td><strong>E-Commerce Rechnung</strong></td><td
							>Checkout → Zahlungsart "Rechnung" → API /api/invoice speichert Kunde automatisch mit
							paymentMethod='rechnung'</td
						></tr
					>
					<tr
						><td><strong>E-Commerce Bar</strong></td><td
							>Checkout → Zahlungsart "Bar" → API /api/create-invoice-bar speichert Kunde
							automatisch mit paymentMethod='bar'</td
						></tr
					>
					<tr
						><td><strong>Bearbeiten/Löschen</strong></td><td
							>Kunden-Tabelle: Klick auf Kundennamen/Email zum Löschen (mit Bestätigung)</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Duplikat-Prüfung:</strong> E-Mail ist primäres Merkmal (case-insensitive). Falls keine
				E-Mail: Prüfung nach Name (Vorname + Nachname). Bei Duplikat: Kunde wird nicht gespeichert, Fehler
				409 Conflict.
			</div>
		</section>

		<section id="arch-api-create-invoice-bar">
			<h2>API: Bar-Zahlung <code class="slice-tag">/api/create-invoice-bar</code></h2>
			<p>
				Erstellt Rechnung + Kunde für Bar-Zahlungen aus E-Commerce-Checkout. Keine E-Mail-Versand,
				Rechnung ist sofort bezahlt (paymentStatus: 'offen' aber paymentMethod: 'bar' signalisiert
				Bar-Zahlung).
			</p>

			<p class="table-label">Request (POST)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>date</code></td><td>ISO String</td><td>Rechnungs-Datum</td></tr>
					<tr><td><code>paymentMethod</code></td><td>String</td><td>Fest: 'bar'</td></tr>
					<tr
						><td><code>service</code>, <code>amount</code>, <code>currency</code></td><td
							>String / Number</td
						><td>Leistung und Betrag</td></tr
					>
					<tr
						><td><code>vorname</code>, <code>nachname</code></td><td>String</td><td
							>Name (erforderlich)</td
						></tr
					>
					<tr
						><td
							><code>firma</code>, <code>email</code>, <code>adresse</code>, <code>plz</code>,
							<code>ort</code>, <code>land</code></td
						><td>String (optional)</td><td>Kontaktdaten</td></tr
					>
					<tr
						><td><code>discountCode</code></td><td>String (optional)</td><td
							>Rabatt-Code (wird in Notizen gespeichert)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Response</p>
			<table>
				<thead><tr><th>Status</th><th>Body</th></tr></thead>
				<tbody>
					<tr
						><td>200 OK</td><td
							><code>&#123;"ok": true, "invoiceNumber": "INV-1719914400000"&#125;</code></td
						></tr
					>
					<tr><td>500 Error</td><td><code>&#123;"ok": false&#125;</code></td></tr>
				</tbody>
			</table>

			<div class="callout">
				<strong>Duplikat-Prüfung:</strong> Kunde wird nur gespeichert wenn nicht bereits existent (E-Mail
				primär). Rechnung wird immer erstellt.
			</div>
		</section>

		<section id="arch-api-invoice">
			<h2>API: Rechnung (E-Commerce) <code class="slice-tag">/api/invoice</code></h2>
			<p>
				Erstellt Rechnung + Kunde für "Rechnung" Zahlungen aus E-Commerce-Checkout. Generiert PDF,
				versendet E-Mail an Kunden und Geschäft, aktualisiert Status zu 'gesendet'.
			</p>

			<p class="table-label">Request (POST)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>data</code></td><td>Object</td><td
							>Checkout-Formular-Daten (Kundendaten + Adresse)</td
						></tr
					>
					<tr><td><code>labels</code></td><td>Object</td><td>i18n-Labels für Rechnungs-PDF</td></tr>
					<tr
						><td><code>serviceKey</code></td><td>String</td><td
							>Leistungs-Schlüssel (z.B. 'webdesign')</td
						></tr
					>
					<tr><td><code>selectedCurrency</code></td><td>String</td><td>Währung (z.B. 'CHF')</td></tr
					>
					<tr><td><code>discountCode</code></td><td>String (optional)</td><td>Rabatt-Code</td></tr>
				</tbody>
			</table>

			<p class="table-label">Response</p>
			<table>
				<thead><tr><th>Feld</th><th>Wert</th></tr></thead>
				<tbody>
					<tr><td><code>ok</code></td><td>true wenn erfolgreich, false bei Fehler</td></tr>
					<tr><td><code>invoiceNumber</code></td><td>String (z.B. "INV-1719914400000")</td></tr>
				</tbody>
			</table>

			<div class="callout">
				<strong>Automatisch:</strong> PDF-Generierung, Kunden-Speicherung (mit Duplikat-Prüfung), E-Mail
				an Kunden + Geschäft. Status: 200 OK bei erfolgreicher E-Mail-Versand, 500 Error wenn E-Mail fehlschlägt.
			</div>
		</section>

		<section id="arch-api-save-customer">
			<h2>API: Kunden speichern <code class="slice-tag">/api/save-customer</code></h2>
			<p>
				Speichert Kunden mit Duplikat-Prévention. Verwendet von Admin (manuell), E-Commerce Checkout
				(Rechnung + Bar). Primäre Duplikat-Prüfung nach E-Mail, Fallback nach Name (Vorname +
				Nachname).
			</p>

			<p class="table-label">Request (POST)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>date</code></td><td>ISO String</td><td>Erfassungs-Datum</td></tr>
					<tr
						><td><code>vorname</code>, <code>nachname</code></td><td>String</td><td
							>Name (erforderlich)</td
						></tr
					>
					<tr
						><td
							><code>firma</code>, <code>email</code>, <code>adresse</code>, <code>plz</code>,
							<code>ort</code>, <code>land</code></td
						><td>String (optional)</td><td>Kontaktdaten</td></tr
					>
					<tr
						><td><code>service</code>, <code>amount</code>, <code>currency</code></td><td
							>String / Number (optional)</td
						><td>Nur für E-Commerce (legacy)</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Response</p>
			<table>
				<thead><tr><th>Status</th><th>Body</th></tr></thead>
				<tbody>
					<tr><td>200 OK</td><td><code>&#123;"ok": true&#125;</code></td></tr>
					<tr
						><td>409 Conflict</td><td
							><code
								>&#123;"ok": false, "exists": true, "message": "Kunde existiert bereits"&#125;</code
							></td
						></tr
					>
					<tr><td>500 Error</td><td><code>&#123;"ok": false&#125;</code></td></tr>
				</tbody>
			</table>

			<div class="callout">
				<strong>Duplikat-Prüfung:</strong> E-Mail ist primäres Merkmal (case-insensitive). Falls keine
				E-Mail: Prüfung nach Name (Vorname + Nachname). Bei Duplikat: 409 Conflict, Kunde wird nicht gespeichert.
			</div>
		</section>

		<section id="arch-ecommerce-checkout">
			<h2>
				E-Commerce Checkout-Integration <code class="slice-tag">beauftragung/zusammenfassung</code>
			</h2>
			<p>
				Der Checkout-Prozess erstellt automatisch Rechnungen und Kunden basierend auf der gewählten
				Zahlungsart. Beide Flows nutzen die API-Endpoints mit Duplikat-Prüfung.
			</p>

			<p class="table-label">Zahlungsart "Rechnung" (Invoice)</p>
			<table>
				<thead><tr><th>Schritt</th><th>Aktion</th></tr></thead>
				<tbody>
					<tr><td>1. Checkout-Form</td><td>Kundenangaben + Leistung auswählen</td></tr>
					<tr><td>2. Zahlungsart wählen</td><td>Benutzer wählt "Rechnung"</td></tr>
					<tr><td>3. API-Call</td><td>POST /api/invoice mit Kundenangaben + Leistung</td></tr>
					<tr
						><td>4. Server-Logik</td><td
							>PDF generieren → Kunde speichern (mit Duplikat-Check) → E-Mail versenden → Status
							'gesendet'</td
						></tr
					>
					<tr
						><td>5. Response</td><td>invoiceNumber zurück an Frontend → Erfolgsseite anzeigen</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Zahlungsart "Bar" (Cash)</p>
			<table>
				<thead><tr><th>Schritt</th><th>Aktion</th></tr></thead>
				<tbody>
					<tr><td>1. Checkout-Form</td><td>Kundenangaben + Leistung auswählen</td></tr>
					<tr><td>2. Zahlungsart wählen</td><td>Benutzer wählt "Bar"</td></tr>
					<tr
						><td>3. API-Call</td><td>POST /api/create-invoice-bar mit Kundenangaben + Leistung</td
						></tr
					>
					<tr
						><td>4. Server-Logik</td><td
							>Rechnung mit paymentMethod='bar' erstellen → Kunde speichern (mit Duplikat-Check) → <strong
								>keine E-Mail</strong
							></td
						></tr
					>
					<tr
						><td>5. Response</td><td>invoiceNumber zurück an Frontend → Erfolgsseite anzeigen</td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Duplikat-Prüfung im Flow:</strong> Beide APIs nutzen /api/save-customer intern, die E-Mail
				als primäres Merkmal prüft. Wenn Kunde existiert, wird er nicht erneut gespeichert, aber die Rechnung
				wird trotzdem erstellt.
			</div>

			<div class="callout">
				<strong>Architektur:</strong> Kunden und Rechnungen sind unabhängig. Ein Kunde kann mehrere Rechnungen
				haben (z.B. wiederholte Beauftragte vom gleichen Kunden).
			</div>
		</section>

		<section id="arch-admin-env">
			<h2>Admin-Panel: Environment Variables</h2>
			<p>Konfiguration für Admin-Panel, E-Commerce Rechnungen und E-Mail-Versand.</p>

			<p class="table-label">Erforderliche Variablen (.env / Netlify)</p>
			<table>
				<thead><tr><th>Variable</th><th>Wert</th><th>Zweck</th></tr></thead>
				<tbody>
					<tr
						><td><code>ADMIN_SECRET</code></td><td>Beliebig (z.B. UUID)</td><td
							>Authentifizierung für /admin/* Routes → URL-Parameter: <code>?secret=...&</code></td
						></tr
					>
					<tr
						><td><code>NETLIFY_SITE_ID</code></td><td>Netlify Site-ID</td><td
							>Blobs-Zugriff (Rechnungen + Kunden)</td
						></tr
					>
					<tr
						><td><code>NETLIFY_TOKEN</code></td><td>Netlify API Token</td><td
							>Blobs-Zugriff (Rechnungen + Kunden)</td
						></tr
					>
					<tr
						><td><code>RESEND_API_KEY</code></td><td>API-Key von resend.com</td><td
							>E-Mail-Versand (Rechnungen)</td
						></tr
					>
					<tr
						><td><code>INVOICE_FROM_EMAIL</code></td><td>Absender-E-Mail</td><td
							>Absender-E-Mail (muss in Resend verifiziert sein)</td
						></tr
					>
					<tr
						><td><code>INVOICE_TO_EMAIL</code></td><td>Geschäfts-E-Mail (optional)</td><td
							>Geschäfts-E-Mail für Benachrichtigungen (bei E-Commerce)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Konfiguration</p>
			<table>
				<thead><tr><th>Umgebung</th><th>Methode</th><th>Datei</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Lokale Entwicklung</strong></td><td
							>Kopiere .env.example → .env und fülle mit echten Keys</td
						><td>.env (gitignored)</td></tr
					>
					<tr
						><td><strong>Production + Branches</strong></td><td
							>Netlify Site Settings → Environment → Variablen setzen</td
						><td>Netlify Dashboard</td></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Ohne E-Mail-Keys:</strong> Rechnungen werden gespeichert, aber E-Mail nicht versendet.
				Status bleibt auf 'gespeichert' (nicht 'gesendet').
			</div>
		</section>

		<section id="arch-admin-terminverwaltung">
			<h2>Admin: Terminverwaltung <code class="slice-tag">admin/buchungen</code></h2>
			<p>
				Verwaltet zeitbasierte Buchungen (Termine, Slots). Drei Tabellen: gebuchte Termine, freie
				Termine, gesperrte Termine. Ermöglicht Löschen von Buchungen und Sperren von Zeitslots.
			</p>

			<p class="table-label">Datenstruktur (BookingRecord)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>terminId</code></td><td>Prismic UID</td><td
							>Eindeutige Termin-ID (Optional: <code>uid_YYYY-MM-DD</code> für Wiederholungen)</td
						></tr
					>
					<tr><td><code>titel</code></td><td>String</td><td>Termin-Titel</td></tr>
					<tr
						><td><code>datum</code>, <code>uhrzeit</code></td><td>String</td><td
							>Termin-Datum und optionale Uhrzeit</td
						></tr
					>
					<tr><td><code>name</code>, <code>email</code></td><td>String</td><td>Kundendaten</td></tr>
					<tr><td><code>bookedAt</code></td><td>ISO String</td><td>Buchungs-Zeitstempel</td></tr>
					<tr
						><td><code>cancelled_termine</code></td><td>Prismic UID</td><td
							>Gesperrte Termine (nicht mehr buchbar)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Workflows</p>
			<table>
				<thead><tr><th>Workflow</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Gebuchte Termine</strong></td><td
							>Alle Buchungen anzeigen → Löschen möglich (Termin wird wieder frei)</td
						></tr
					>
					<tr
						><td><strong>Freie Termine</strong></td><td>Verfügbare Slots (noch nicht gebucht)</td
						></tr
					>
					<tr
						><td><strong>Gesperrte Termine</strong></td><td
							>Manuell gesperrte Slots (nicht mehr buchbar)</td
						></tr
					>
					<tr
						><td><strong>Termin löschen</strong></td><td
							>Buchung entfernen → Termin wird wieder frei</td
						></tr
					>
					<tr
						><td><strong>Termin sperren</strong></td><td
							>Slot blockieren (wird nicht mehr buchbar)</td
						></tr
					>
				</tbody>
			</table>
		</section>

		<section id="arch-admin-ressourcebuchungen">
			<h2>Admin: Ressource-Buchungen <code class="slice-tag">admin/ressource-buchungen</code></h2>
			<p>
				Verwaltet Buchungen für Ressourcen wie Ferienwohnungen, Räume, etc. Zeigt Buchungen
				gruppiert nach Ressource mit Status-Tracking (Ausstehend → Bestätigt → Eingecheckt →
				Ausgecheckt → Abgerechnet).
			</p>

			<p class="table-label">Status-Flow</p>
			<table>
				<thead><tr><th>Status</th><th>Label</th><th>Aktion</th></tr></thead>
				<tbody>
					<tr><td><code>pending</code></td><td>Ausstehend</td><td>→ Bestätigen + Mail</td></tr>
					<tr><td><code>confirmed</code></td><td>Bestätigt</td><td>→ Check-in + Mail</td></tr>
					<tr
						><td><code>checked_in</code></td><td>Eingecheckt</td><td
							>→ Check-out + Abrechnungsmail</td
						></tr
					>
					<tr
						><td><code>checked_out</code></td><td>Ausgecheckt</td><td>→ Abrechnung freigeben</td
						></tr
					>
					<tr><td><code>abgerechnet</code></td><td>Abgerechnet</td><td>—</td></tr>
				</tbody>
			</table>

			<p class="table-label">Datenstruktur (ResourceBookingRecord)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>ressourceUid</code></td><td>Prismic UID</td><td
							>Ressource (Ferienwohnung, Raum, etc.)</td
						></tr
					>
					<tr
						><td><code>status</code></td><td
							>pending | confirmed | checked_in | checked_out | abgerechnet</td
						><td>Buchungs-Status</td></tr
					>
					<tr
						><td><code>von</code>, <code>bis</code></td><td>ISO String</td><td
							>Anreise- und Abreise-Datum</td
						></tr
					>
					<tr
						><td><code>name</code>, <code>email</code>, <code>telefon</code></td><td>String</td><td
							>Kundendaten</td
						></tr
					>
					<tr
						><td><code>personen</code>, <code>nächte</code></td><td>Number</td><td
							>Anzahl Personen und Übernachtungen</td
						></tr
					>
					<tr><td><code>preis</code></td><td>Number</td><td>Gesamtpreis (CHF)</td></tr>
					<tr
						><td><code>reminderSent</code></td><td>Boolean</td><td>Erinnerungsmail versendet</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Features</p>
			<table>
				<thead><tr><th>Feature</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td>Gruppierung nach Ressource</td><td
							>Buchungen sind nach Ressource organisiert, expandierbar</td
						></tr
					>
					<tr
						><td>Status-Transitionen</td><td
							>Buttons für Zustandsübergänge mit automatischen Mails</td
						></tr
					>
					<tr><td>Konflikt-Check</td><td>Automatische Prüfung auf Zimmer-Überbuchung</td></tr>
					<tr><td>Saisonpreise</td><td>Preisberechnung basierend auf Saison</td></tr>
					<tr
						><td>Erinnerungsmails</td><td>Automatische Check-in/Check-out Benachrichtigungen</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">E-Mail-Flow</p>
			<table>
				<thead
					><tr
						><th>Auslöser</th><th>Empfänger</th><th>Status-Änderung</th><th>CMS-Template</th><th
							>Tokens</th
						></tr
					></thead
				>
				<tbody>
					<tr
						><td>Neue Buchungsanfrage (Mieter bucht)</td><td>Betreiber</td><td
							>— (Buchung erstellt mit <code>pending</code>)</td
						><td>Fixer Text mit Buchungsdetails</td><td>—</td></tr
					>
					<tr
						><td>Buchung bestätigen</td><td>Mieter</td><td>✓ pending → confirmed</td><td
							><code>confirmation_text</code> / <code>confirmation_betreff</code></td
						><td
							><code>&#123;&#123;Name&#125;&#125;</code>
							<code>&#123;&#123;Ressource&#125;&#125;</code>
							<code>&#123;&#123;Anreise&#125;&#125;</code>
							<code>&#123;&#123;Abreise&#125;&#125;</code>
							<code>&#123;&#123;Preis&#125;&#125;</code>
							<code>&#123;&#123;Buchungsreferenz&#125;&#125;</code></td
						></tr
					>
					<tr
						><td>48h vor Anreise <em>(tägl. 08:00 UTC)</em></td><td>Mieter</td><td
							>✗ kein Status-Wechsel</td
						><td><code>reminder_text</code> / <code>reminder_betreff</code></td><td
							><code>&#123;&#123;Türcode&#125;&#125;</code>
							<code>&#123;&#123;Name&#125;&#125;</code>
							<code>&#123;&#123;Anreise&#125;&#125;</code>
							<code>&#123;&#123;Abreise&#125;&#125;</code>
							<code>&#123;&#123;Buchungsreferenz&#125;&#125;</code>
							<code>&#123;&#123;WhatsApp&#125;&#125;</code>
							— setzt <code>reminderSent = true</code></td
						></tr
					>
					<tr
						><td>Check-in</td><td>Betreiber (intern)</td><td>✓ confirmed → checked_in</td><td
							>Fixer Text</td
						><td>—</td></tr
					>
					<tr
						><td>24h nach Ankunft <em>(tägl. 08:00 UTC)</em></td><td>Mieter</td><td
							>✗ kein Status-Wechsel</td
						><td>CMS-Template (Nach-Ankunft)</td><td
							><code>&#123;&#123;Türcode&#125;&#125;</code>
							<code>&#123;&#123;Name&#125;&#125;</code>
							<code>&#123;&#123;Anreise&#125;&#125;</code>
							<code>&#123;&#123;Abreise&#125;&#125;</code>
							<code>&#123;&#123;Buchungsreferenz&#125;&#125;</code>
							<code>&#123;&#123;WhatsApp&#125;&#125;</code></td
						></tr
					>
					<tr
						><td>12h vor Abreise <em>(tägl. 20:00 UTC)</em></td><td>Mieter</td><td
							>✗ kein Status-Wechsel</td
						><td><code>abreise_text</code> / <code>abreise_betreff</code></td><td
							><code>&#123;&#123;Türcode&#125;&#125;</code>
							<code>&#123;&#123;Name&#125;&#125;</code>
							<code>&#123;&#123;Anreise&#125;&#125;</code>
							<code>&#123;&#123;Abreise&#125;&#125;</code>
							<code>&#123;&#123;Buchungsreferenz&#125;&#125;</code>
							<code>&#123;&#123;WhatsApp&#125;&#125;</code>
							— setzt <code>abreiseReminderSent = true</code></td
						></tr
					>
					<tr
						><td>Check-out</td><td>Betreiber (intern)</td><td>✓ checked_in → checked_out</td><td
							>Fixer Text mit Freigabe-Link</td
						><td>—</td></tr
					>
					<tr
						><td>Abrechnung freigeben</td><td>Mieter</td><td>✓ checked_out → abgerechnet</td><td
							>CMS-Template (Abrechnung)</td
						><td
							><code>&#123;&#123;Name&#125;&#125;</code>
							<code>&#123;&#123;Betrag&#125;&#125;</code>
							<code>&#123;&#123;Buchungsreferenz&#125;&#125;</code></td
						></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Sofort-Erinnerung bei Bestätigung:</strong> Falls die Ankunft beim Bestätigen
				bereits innerhalb von 48h liegt und <code>reminderSent = false</code>, wird die
				Ankunftserinnerung sofort gesendet (<code>reminderMail.ts</code>), ohne auf den Scheduler zu
				warten.
			</div>
			<div class="callout">
				<strong>Betreiber-Kopie:</strong> Jede automatische Erinnerungsmail (48h, 24h, 12h) löst
				eine Bestätigungskopie an <code>INVOICE_FROM_EMAIL</code> aus.
			</div>
		</section>

		<section id="arch-kundenauthentifizierung">
			<h2>Kunden-Authentifizierung <code class="slice-tag">konto/*</code></h2>
			<p>
				User-System für Website-Besucher: Registrierung, Login, Passwort-Reset, E-Mail-Verifikation.
				Benötigt aktives Feature <code>terminbuchung</code>. Sessions werden in Netlify Blobs
				gespeichert, Cookies sind HttpOnly + Secure.
			</p>

			<p class="table-label">Routes</p>
			<table>
				<thead><tr><th>Route</th><th>Funktion</th><th>Authentifiziert?</th></tr></thead>
				<tbody>
					<tr
						><td><code>/konto</code></td><td>Konto-Dashboard (Profil, Buchungen)</td><td>Ja ✓</td
						></tr
					>
					<tr
						><td><code>/konto/registrierung</code></td><td
							>Registrierung (mit E-Mail-Verifikation)</td
						><td>Nein</td></tr
					>
					<tr
						><td><code>/konto/anmelden</code></td><td>Login (setzt Session-Cookie)</td><td>Nein</td
						></tr
					>
					<tr><td><code>/konto/abmelden</code></td><td>Logout (löscht Session)</td><td>Ja ✓</td></tr
					>
					<tr
						><td><code>/konto/passwort-reset</code></td><td>Passwort-Zurücksetzen (mit Token)</td
						><td>Nein</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Datenstruktur (UserRecord)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr><td><code>id</code></td><td>UUID</td><td>Eindeutige Benutzer-ID</td></tr>
					<tr
						><td><code>email</code></td><td>String</td><td>E-Mail (Blob-Key, case-insensitive)</td
						></tr
					>
					<tr
						><td><code>passwordHash</code></td><td>String</td><td
							>Gehashtes Passwort (bcrypt, salt 12)</td
						></tr
					>
					<tr><td><code>name</code></td><td>String</td><td>Benutzer-Name</td></tr>
					<tr><td><code>verified</code></td><td>Boolean</td><td>E-Mail verifiziert?</td></tr>
					<tr
						><td><code>createdAt</code></td><td>ISO String</td><td>Registrierungs-Timestamp</td></tr
					>
				</tbody>
			</table>

			<p class="table-label">Workflows</p>
			<table>
				<thead><tr><th>Workflow</th><th>Schritte</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Registrierung</strong></td><td
							>Form ausfüllen → User mit Hash erstellt → Verifikations-E-Mail mit Token (24h gültig)
							→ Link bestätigt E-Mail → Umleitung zum Login</td
						></tr
					>
					<tr
						><td><strong>Login</strong></td><td
							>E-Mail + Passwort eingeben → Passwort mit Hash verifiziert → Session erstellt (30
							Tage TTL) → HttpOnly Cookie gesetzt → /konto Dashboard</td
						></tr
					>
					<tr
						><td><strong>Logout</strong></td><td
							>Session löschen → Cookie löschen → Umleitung zu Homepage</td
						></tr
					>
					<tr
						><td><strong>Passwort-Reset</strong></td><td
							>E-Mail eingeben → Reset-Token erstellt (24h TTL) → E-Mail mit Link versendet → Token
							abgerufen → Neues Passwort gespeichert</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Sicherheit</p>
			<table>
				<thead><tr><th>Aspekt</th><th>Implementierung</th></tr></thead>
				<tbody>
					<tr><td>Passwort-Speicherung</td><td>bcrypt mit Salt 12 (kein Plaintext)</td></tr>
					<tr
						><td>Session-Cookie</td><td
							>HttpOnly + SameSite=Lax (kein JavaScript-Zugriff, CSRF-Schutz)</td
						></tr
					>
					<tr
						><td>Token-Expiration</td><td
							>Verify: 24h, Reset: 24h, Sessions: 30 Tage (abgelaufen = automatisch gelöscht)</td
						></tr
					>
					<tr
						><td>Duplikat-Prüfung</td><td
							>E-Mail case-insensitive + normalisiert (keine doppelten Accounts)</td
						></tr
					>
					<tr><td>Spam-Schutz</td><td>Honeypot-Feld im Registrierungs-Form</td></tr>
				</tbody>
			</table>

			<div class="callout">
				<strong>Feature-Gate:</strong> Registrierung + Login benötigen
				<code>isFeatureActive('terminbuchung')</code>. Wenn Feature inaktiv: 404 auf diesen Routes.
			</div>

			<div class="callout">
				<strong>E-Mail-Versand:</strong> Nutzt <code>RESEND_API_KEY</code> +
				<code>INVOICE_FROM_EMAIL</code>. Wenn nicht konfiguriert: User wird trotzdem erstellt,
				E-Mail versendet nicht (kein Fehler-Abbruch).
			</div>
		</section>

		<section id="arch-agency-gating">
			<h2>Agency: Gating Editor <code class="slice-tag">agency/gating</code></h2>
			<p>
				<strong>Nur für Agentur/Developer mit AGENCY_SECRET!</strong> Visual Editor für
				<code>gating.json</code> — verwaltet Pläne, Features und Slice-Gates. Änderungen werden direkt
				in die Datei geschrieben und können committed werden.
			</p>

			<div class="callout callout-warn">
				<strong>Warnung:</strong> Dieser Editor ist absichtlich <strong>nicht</strong> im
				öffentlichen Admin-Panel. Der Betreiber darf keinen Zugriff haben, da er sonst bezahlte
				Features kostenlos freischalten könnte. Route:
				<code>/agency/gating?secret=&#36;&#123;AGENCY_SECRET&#125;</code>
			</div>

			<p class="table-label">Verwaltete Bereiche</p>
			<table>
				<thead><tr><th>Bereich</th><th>Verwaltung</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Pläne</strong></td><td
							>Erstelle neue Pläne (starter, professional, individuell), definiere Hierarchie via <code
								>extends</code
							></td
						></tr
					>
					<tr
						><td><strong>Features</strong></td><td
							>Neue Features anlegen, Pläne zuordnen die das Feature freischalten</td
						></tr
					>
					<tr
						><td><strong>Slices</strong></td><td
							>Gating für gesamte Slices oder einzelne Variations/Felder (plan- oder
							feature-basiert)</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Gate-Typen</p>
			<table>
				<thead><tr><th>Typ</th><th>Beschreibung</th><th>Effekt</th></tr></thead>
				<tbody>
					<tr
						><td><code>none</code></td><td>Keine Begrenzung</td><td>Verfügbar in allen Plänen</td
						></tr
					>
					<tr
						><td><code>plan</code></td><td>Plan-basiert (z.B. "professional")</td><td
							>Aktiv in diesem Plan + allen übergeordneten Plänen</td
						></tr
					>
					<tr
						><td><code>feature</code></td><td>Feature-basiert (z.B. "ecommerce")</td><td
							>Aktiv nur wenn Feature aktiviert ist</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Struktur in gating.json</p>
			<table>
				<thead><tr><th>Level</th><th>Beispiel</th><th>Effekt wenn inaktiv</th></tr></thead>
				<tbody>
					<tr
						><td>Slice-Level</td><td><code>slices.Hero.plan = "professional"</code></td><td
							>Ganzer Hero-Slice wird nicht generiert</td
						></tr
					>
					<tr
						><td>Variation-Level</td><td
							><code>slices.Hero.variations.banner.feature = "ecommerce"</code></td
						><td>Banner-Variation fehlt in model.json</td></tr
					>
					<tr
						><td>Feld-Level</td><td
							><code>slices.Hero.fields.mit_suche.plan = "professional"</code></td
						><td>Feld fehlt in allen Variationen</td></tr
					>
				</tbody>
			</table>

			<div class="callout">
				<strong>Auto-Discovery:</strong> Der Editor importiert Slice-Namen vom Dateisystem und vereinigt
				sie mit gating.json-Einträgen. Neue Slices müssen hier gated werden, bevor sie in Slices Machine
				verfügbar sind.
			</div>
		</section>

		<section id="arch-admin-aufgaben">
			<h2>Admin: Aufgaben-Annahmen <code class="slice-tag">admin/aufgaben</code></h2>
			<p>
				Verwaltet angenommene Aufgaben (Credits, Reviews, etc.) mit Status-Tracking. Zeigt Annahmen
				gruppiert nach Aufgabe mit Status (Angenommen → Bestätigt → In Bearbeitung → Erledigt).
			</p>

			<p class="table-label">Status-Flow</p>
			<table>
				<thead><tr><th>Status</th><th>Label</th><th>Bedeutung</th></tr></thead>
				<tbody>
					<tr
						><td><code>angenommen</code></td><td>Angenommen</td><td
							>Aufgabe wurde angenommen, Bestätigung ausstehend</td
						></tr
					>
					<tr
						><td><code>annahme_bestaetigt</code></td><td>Bestätigt</td><td
							>Annahme bestätigt, Bearbeitung läuft</td
						></tr
					>
					<tr
						><td><code>eingereicht</code></td><td>In Bearbeitung</td><td
							>Aufgabe in aktiver Bearbeitung</td
						></tr
					>
					<tr><td><code>erledigt</code></td><td>Erledigt</td><td>Aufgabe abgeschlossen</td></tr>
				</tbody>
			</table>

			<p class="table-label">Datenstruktur (AnnahmeRecord)</p>
			<table>
				<thead><tr><th>Feld</th><th>Typ</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><code>aufgabeUid</code></td><td>Prismic UID</td><td
							>Aufgabe (z.B. Webdesign, Logo-Redesign)</td
						></tr
					>
					<tr><td><code>aufgabeTitel</code></td><td>String</td><td>Titel der Aufgabe</td></tr>
					<tr
						><td><code>status</code></td><td
							>angenommen | annahme_bestaetigt | eingereicht | erledigt</td
						><td>Bearbeitungsstatus</td></tr
					>
					<tr><td><code>name</code>, <code>email</code></td><td>String</td><td>Kundendaten</td></tr>
					<tr
						><td><code>buchungUid</code></td><td>Prismic UID (optional)</td><td
							>Verknüpfte Buchung</td
						></tr
					>
					<tr
						><td><code>creditTyp</code></td><td>String</td><td
							>Art des Credits (z.B. "hours", "meetings")</td
						></tr
					>
					<tr
						><td><code>credits</code>, <code>minuten</code></td><td>Number</td><td
							>Anzahl Credits und Minuten</td
						></tr
					>
					<tr
						><td><code>kommentar</code></td><td>String (optional)</td><td>Notizen zur Aufgabe</td
						></tr
					>
					<tr
						><td><code>angenommenAm</code>, <code>erledigtAm</code></td><td>ISO String</td><td
							>Zeitstempel Annahme / Fertigstellung</td
						></tr
					>
				</tbody>
			</table>

			<p class="table-label">Workflows</p>
			<table>
				<thead><tr><th>Workflow</th><th>Beschreibung</th></tr></thead>
				<tbody>
					<tr
						><td><strong>Annahme bestätigen</strong></td><td
							>Status von "Angenommen" auf "Bestätigt" setzen</td
						></tr
					>
					<tr
						><td><strong>Bearbeitung markieren</strong></td><td
							>Status auf "In Bearbeitung" setzen wenn Arbeit startet</td
						></tr
					>
					<tr
						><td><strong>Als erledigt markieren</strong></td><td
							>Aufgabe finalisieren und Timestamp speichern</td
						></tr
					>
					<tr><td><strong>Löschen</strong></td><td>Annahme vollständig entfernen</td></tr>
				</tbody>
			</table>

			<div class="callout">
				<strong>Gruppierung:</strong> Mehrere Annahmen können zur gleichen Aufgabe gehören (z.B. mehrere
				Kunden nehmen die gleiche Leistung an). Sie sind nach aufgabeUid gruppiert.
			</div>
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
		background: var(--doku-bg);
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
	.nav-group-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--doku-text-faint);
		margin: 1.25rem 0 0.25rem;
		padding: 0 0.5rem;
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
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		color: var(--doku-nav-link);
		text-decoration: none;
		font-size: 0.82rem;
		transition:
			color 0.15s,
			background 0.15s;
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

	/* ── Section divider ── */
	.section-divider {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--doku-text-faint);
		border-top: 1px solid var(--doku-border);
		padding: 2.5rem 0 0.5rem;
		margin: 1rem 0 1.5rem;
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
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--doku-heading);
		margin: 0 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--doku-border);
		scroll-margin-top: 2rem;
	}
	section {
		margin-bottom: 3rem;
	}
	p {
		margin: 0 0 0.75rem;
		color: var(--doku-text-muted);
	}
	ul {
		color: var(--doku-text-muted);
		padding-left: 1.5rem;
	}
	li {
		margin-bottom: 0.4rem;
	}

	/* Slice-ID Badge */
	.slice-tag {
		font-size: 0.72rem;
		background: var(--doku-surface);
		color: var(--doku-text-dim);
		border: 1px solid var(--doku-surface-border);
		border-radius: 4px;
		padding: 0.1em 0.5em;
		font-family: 'Fira Mono', 'Consolas', monospace;
		font-weight: 400;
	}

	/* Variationen-Pills */
	.pills {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}
	.pill {
		font-size: 0.75rem;
		background: var(--doku-surface);
		color: var(--doku-nav-link);
		border: 1px solid var(--doku-surface-border);
		border-radius: 999px;
		padding: 0.15em 0.65em;
		font-family: 'Fira Mono', 'Consolas', monospace;
	}
	.pill.gate {
		background: #1f1b10;
		color: var(--doku-callout-warn-text);
		border-color: #3d3210;
	}

	/* Feld-Gate Label */
	.field-gate {
		display: inline-block;
		font-size: 0.65rem;
		background: #1f1b10;
		color: var(--doku-callout-warn-text);
		border-radius: 3px;
		padding: 0.1em 0.4em;
		vertical-align: middle;
		margin-left: 0.25rem;
	}

	/* Tabellen-Labels */
	.table-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--doku-text-faint);
		margin: 1rem 0 0.35rem;
	}
	.table-label-note {
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
		color: var(--doku-text-dim);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
	th {
		background: var(--doku-surface);
		text-align: left;
		padding: 0.4rem 0.75rem;
		font-weight: 600;
		color: var(--doku-table-header);
		border: 1px solid var(--doku-surface-border);
	}
	td {
		padding: 0.4rem 0.75rem;
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
	.callout {
		background: var(--doku-callout-bg);
		border-left: 3px solid var(--doku-callout-border);
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0.65rem 1rem;
		margin: 0.75rem 0 0;
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
