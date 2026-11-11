---
name: chatbot-wissensbasis
description: Aktualisiert die Chat-Bot-Wissensbasis docs/chatbot-wissensbasis.html (KLAP WEB) — neue Funktionen seit dem letzten Stand in die Anleitungen einarbeiten, Feldreferenz neu erzeugen, mit dem Bot-Modell testen. Verwenden, wenn der User «Wissensbasis aktualisieren» o. ä. verlangt oder /chatbot-wissensbasis aufruft.
---

# Chat-Bot-Wissensbasis aktualisieren

Die Wissensbasis ist die Vorlage für das Prismic-Feld «Chat-Bot Wissensbasis» (Einstellungen → Tab «Chat-Bot») von klap-web.ch. Manuelle Ergänzungen pflegt der User im Feld «Chat-Bot Wissensbasis – Ergänzungen» (Vorrang bei Widersprüchen) — nie in die generierte Datei übernehmen. Leser sind Kundinnen und Kunden von KLAP WEB (Website-Betreiber, keine Entwickler): Deutsch, du-Form, einfache Sprache.

**Begriffe (verbindlich, wie auf klap-web.ch/anleitung):**

- In allgemein erklärenden Texten «Inhalts-Typ» (statt «Type») und «Inhalts-Element» (statt «Slice») — die Prismic-Wörter sagen dort nichts aus.
- Bei direktem Bezug auf das Prismic-GUI (was dort angeschrieben ist, z. B. ein Filter «Type», der Knopf «Add slice») die Prismic-Wörter genau so verwenden, gern mit dem eigenen Begriff in Klammern: «Type» (Inhalts-Typ).
- «Custom Type» und «Page Type» nie — kommen im Prismic-GUI nicht vor.
- Knöpfe und Felder sonst genau wie im Prismic-GUI bzw. wie das Feld-Label.

**Nicht Teil dieses Tasks:** die Entwickler-Wissensbasis für `@dev` (`src/lib/generated/chatbot-dev-wissensbasis.md`) entsteht automatisch bei `npm run dev`/`build` (`npm run wissensbasis:dev`) aus CLAUDE.md, `docs/` usw. — nichts von Hand pflegen, nichts davon in diese Kunden-Wissensbasis übernehmen (intern).

## Ablauf

1. **Branch prüfen** (`git branch --show-current`). Die Datei liegt in `docs/` und ist Kern. Am vollständigsten ist die Feldliste auf `klap-web-ch` (alle Features aktiv). Branch nie selbst wechseln.

2. **Quelle der Anleitungen:** `src/lib/anleitung/` — `index.json` (Reihenfolge, Titel, `feature`, `stand`, `sources`) und `kapitel/<id>.html` (Text). Daraus entstehen **beide** Ausgaben: der Abschnitt zwischen `AUTO:ANLEITUNGEN` in der Wissensbasis und die Website klap-web.ch/anleitung (Inhalts-Element «Anleitung», Feld «Kapitel aus der Anleitung»). Texte nur in den Kapitel-Dateien ändern, nie zwischen den Markierungen. Die Prismic-Seite `anleitung` enthält nur noch Ergänzungen (Einleitung, Bilder, Videos) — bei Widerspruch zu einem Kapitel dem User melden.

3. **Stand ermitteln:** `npm run check:anleitung` listet die Kapitel, deren Quellen (`sources`) seit ihrem `stand` geändert wurden, und Funktionen ohne Kapitel. Pro Kapitel die Änderungen ansehen: `git log main --no-merges --since=<stand> --format="%h %ad %s" --date=short -- <sources>`. Zusätzlich für Neues ohne Kapitel:
   - `git log main --since=<ältester stand> --format="%h %ad %s" --date=short`
   - `git diff <erster Commit seit Stand>^ main -- CLAUDE.md gating.json customtypes src/lib/slices/*/base.json docs/` (neue Felder, Features, Regeln)
   - Nur, was Website-Betreiber betrifft: neue/geänderte Felder in Prismic, neue Admin-Bereiche, geändertes Verhalten der Website, neue Platzhalter, E-Mails. Interne Technik (Refactorings, Build, CSS-Umbau) weglassen.

4. **Kapitel anpassen** (`src/lib/anleitung/kapitel/*.html`; die von Hand geschriebenen Abschnitte der Wissensbasis — Über KLAP WEB, Preise, Häufige Fragen — direkt in `docs/chatbot-wissensbasis.html` ausserhalb der Markierungen):
   - Bestehende Abschnitte ergänzen statt neu schreiben; Gliederung beibehalten. Neue Funktion → neue Datei `kapitel/<id>.html` (ohne `<h2>`, der Titel steht im Index) + Eintrag in `index.json` an passender Stelle: `id`, `title`, `feature` (ID aus `gating.json`, steuert den Paket-Filter auf der Website), `stand`, `sources` (Pfade, deren Änderung den Text veralten lässt). Titel bestehender Kapitel nicht umbenennen (sonst verliert das Auswahlfeld in Prismic die Zuordnung) — wenn nötig, dem User melden.
   - Nummerierte Schritte für Abläufe, Listen für Optionen. Kein Markdown, nur das vorhandene HTML (h3/p/ol/ul/li).
   - Feldnamen exakt wie das Label in Prismic (aus `base.json` bzw. der generierten Feldreferenz).
   - Begriffe prüfen: `grep -rn "Custom Type\|Page Type" src/lib/anleitung docs/chatbot-wissensbasis.html` → ausserhalb der Feldreferenz nichts. Jede Stelle mit «Type»/«Slice» darauf prüfen, ob sie wirklich das Prismic-GUI meint; sonst Inhalts-Typ/Inhalts-Element.
   - Keine Preise, Pakete oder Zusagen erfinden — Preise nur aus Prismic (klap-web.ch) bzw. `gating.json`; bei Unsicherheit den User fragen.
   - Häufige Fragen ergänzen, wenn eine Neuerung typische Fehler mit sich bringt.

5. **Wissensbasis neu erzeugen** (Kapitel + Feldreferenz):

   ```
   node scripts/build-customtypes.js
   npm run wissensbasis
   ```

   (`scripts/chatbot-wissensbasis.js` ersetzt die Teile zwischen `AUTO:ANLEITUNGEN` (aus `src/lib/anleitung`) und `AUTO:FELDREFERENZ`; Agentur-Beschreibungen aus `src/lib/fieldDescriptions.json`.)

6. **Stand-Datum:** bei jedem geprüften Kapitel `stand` in `index.json` auf heute setzen (auch wenn der Text unverändert stimmt), ebenso im Kommentar oben in der Wissensbasis. `npm run check:anleitung` darf danach keine veralteten Kapitel mehr melden.

7. **Testen** mit dem Bot-Modell (`claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY` aus `.env`, nie ausgeben): temporäres Script im Scratchpad, System-Prompt wie in `src/routes/api/chat/+server.ts` (Basis-Prompt + `WISSENSBASIS:` + Schlussregeln), Wissensbasis = Text der HTML-Datei (Überschriften als `#`, Listen als `- `). 4–6 Fragen zu den Neuerungen, je eine auf Deutsch und Englisch, plus eine Frage, die nicht in der Wissensbasis steht (muss auf die Kontaktseite verweisen). Falsche Antworten → Text präzisieren und erneut testen. Eine Frage zu den Begriffen («Was ist ein Inhalts-Typ?») gehört immer dazu.

8. **Bericht an den User** (Deutsch, kurz): welche Abschnitte neu/geändert, gemeldete Widersprüche zur Prismic-Seite, Testergebnis, Grösse (Wörter), und der Hinweis zum Übernehmen: Datei im Browser öffnen (`file:///…/docs/chatbot-wissensbasis.html`, nicht über den Dev-Server) → Ctrl+A, kopieren → Prismic Einstellungen → «Chat-Bot Wissensbasis» → einfügen → veröffentlichen. Nichts committen.
