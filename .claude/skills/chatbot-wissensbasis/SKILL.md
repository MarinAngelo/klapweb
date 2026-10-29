---
name: chatbot-wissensbasis
description: Aktualisiert die Chat-Bot-Wissensbasis docs/chatbot-wissensbasis.html (KLAP WEB) — neue Funktionen seit dem letzten Stand in die Anleitungen einarbeiten, Feldreferenz neu erzeugen, mit dem Bot-Modell testen. Verwenden, wenn der User «Wissensbasis aktualisieren» o. ä. verlangt oder /chatbot-wissensbasis aufruft.
---

# Chat-Bot-Wissensbasis aktualisieren

Die Wissensbasis ist die Vorlage für das Prismic-Feld «Chat-Bot Wissensbasis» (Einstellungen → Main) von klap-web.ch. Leser sind Kundinnen und Kunden von KLAP WEB (Website-Betreiber, keine Entwickler): Deutsch, du-Form, einfache Sprache, Prismic-Begriffe so, wie sie im Backend heissen.

## Ablauf

1. **Branch prüfen** (`git branch --show-current`). Die Datei liegt in `docs/` und ist Kern. Am vollständigsten ist die Feldliste auf `klap-web-ch` (alle Features aktiv). Branch nie selbst wechseln.

2. **Stand ermitteln:** Im Kommentar oben in `docs/chatbot-wissensbasis.html` steht «Stand der Anleitungen: JJJJ-MM-TT». Alle Änderungen seither sammeln:
   - `git log main --since=<Stand> --format="%h %ad %s" --date=short`
   - `git diff <erster Commit seit Stand>^ main -- CLAUDE.md gating.json customtypes src/lib/slices/*/base.json docs/` (neue Felder, Features, Regeln)
   - Nur, was Website-Betreiber betrifft: neue/geänderte Felder in Prismic, neue Admin-Bereiche, geändertes Verhalten der Website, neue Platzhalter, E-Mails. Interne Technik (Refactorings, Build, CSS-Umbau) weglassen.

3. **Anleitungen anpassen** (Abschnitte `<h2>` ausserhalb der Markierungen `AUTO:FELDREFERENZ`):
   - Bestehende Abschnitte ergänzen statt neu schreiben; Gliederung beibehalten. Neue Funktion → eigener Abschnitt «Anleitung: …» an passender Stelle.
   - Nummerierte Schritte für Abläufe, Listen für Optionen. Kein Markdown, nur das vorhandene HTML (h2/h3/p/ol/ul/li).
   - Feldnamen exakt wie das Label in Prismic (aus den Custom Types / `base.json` bzw. der generierten Feldreferenz).
   - Keine Preise, Pakete oder Zusagen erfinden — Preise nur aus Prismic (klap-web.ch) bzw. `gating.json`; bei Unsicherheit den User fragen.
   - Häufige Fragen ergänzen, wenn eine Neuerung typische Fehler mit sich bringt.

4. **Feldreferenz neu erzeugen:**

   ```
   node scripts/build-customtypes.js
   npm run wissensbasis
   ```

   (`scripts/chatbot-wissensbasis.js` ersetzt nur den Teil zwischen `<!-- AUTO:FELDREFERENZ:START -->` und `END`; Agentur-Beschreibungen aus `src/lib/fieldDescriptions.json`.)

5. **Stand-Datum** im Kommentar oben auf heute setzen.

6. **Testen** mit dem Bot-Modell (`claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY` aus `.env`, nie ausgeben): temporäres Script im Scratchpad, System-Prompt wie in `src/routes/api/chat/+server.ts` (Basis-Prompt + `WISSENSBASIS:` + Schlussregeln), Wissensbasis = Text der HTML-Datei (Überschriften als `#`, Listen als `- `). 4–6 Fragen zu den Neuerungen, je eine auf Deutsch und Englisch, plus eine Frage, die nicht in der Wissensbasis steht (muss auf die Kontaktseite verweisen). Falsche Antworten → Text präzisieren und erneut testen.

7. **Bericht an den User** (Deutsch, kurz): welche Abschnitte neu/geändert, Testergebnis, Grösse (Wörter), und der Hinweis zum Übernehmen: Datei im Browser öffnen (`file:///…/docs/chatbot-wissensbasis.html`, nicht über den Dev-Server) → Ctrl+A, kopieren → Prismic Einstellungen → «Chat-Bot Wissensbasis» → einfügen → veröffentlichen. Nichts committen.
