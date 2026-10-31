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

## Ablauf

1. **Branch prüfen** (`git branch --show-current`). Die Datei liegt in `docs/` und ist Kern. Am vollständigsten ist die Feldliste auf `klap-web-ch` (alle Features aktiv). Branch nie selbst wechseln.

2. **Anleitungs-Seite lesen (Hauptquelle für Texte und Begriffe):** die veröffentlichte Seite `anleitung` (Inhalts-Typ `page`, Sprache `de-ch`) im Prismic-Repo `klap-web-ch` über die öffentliche API laden (`https://klap-web-ch.cdn.prismic.io/api/v2` → Master-Ref → `documents/search?q=[[at(my.page.uid,"anleitung")]]`) und als Text ausgeben. Abweichungen zur Wissensbasis übernehmen: geänderte Begriffe, Abläufe, neue oder entfernte Themen. Bei Widerspruch zwischen Seite und Code: dem User melden (die Seite kann veraltet sein), nicht stillschweigend eine Seite wählen.

3. **Stand ermitteln:** Im Kommentar oben in `docs/chatbot-wissensbasis.html` steht «Stand der Anleitungen: JJJJ-MM-TT». Alle Änderungen seither sammeln:
   - `git log main --since=<Stand> --format="%h %ad %s" --date=short`
   - `git diff <erster Commit seit Stand>^ main -- CLAUDE.md gating.json customtypes src/lib/slices/*/base.json docs/` (neue Felder, Features, Regeln)
   - Nur, was Website-Betreiber betrifft: neue/geänderte Felder in Prismic, neue Admin-Bereiche, geändertes Verhalten der Website, neue Platzhalter, E-Mails. Interne Technik (Refactorings, Build, CSS-Umbau) weglassen.

4. **Anleitungen anpassen** (Abschnitte `<h2>` ausserhalb der Markierungen `AUTO:FELDREFERENZ`):
   - Bestehende Abschnitte ergänzen statt neu schreiben; Gliederung beibehalten. Neue Funktion → eigener Abschnitt «Anleitung: …» an passender Stelle.
   - Nummerierte Schritte für Abläufe, Listen für Optionen. Kein Markdown, nur das vorhandene HTML (h2/h3/p/ol/ul/li).
   - Feldnamen exakt wie das Label in Prismic (aus `base.json` bzw. der generierten Feldreferenz).
   - Begriffe prüfen: `grep -n "Custom Type\|Page Type" docs/chatbot-wissensbasis.html` → ausserhalb der Feldreferenz nichts. Jede Stelle mit «Type»/«Slice» darauf prüfen, ob sie wirklich das Prismic-GUI meint; sonst Inhalts-Typ/Inhalts-Element.
   - Keine Preise, Pakete oder Zusagen erfinden — Preise nur aus Prismic (klap-web.ch) bzw. `gating.json`; bei Unsicherheit den User fragen.
   - Häufige Fragen ergänzen, wenn eine Neuerung typische Fehler mit sich bringt.

5. **Feldreferenz neu erzeugen:**

   ```
   node scripts/build-customtypes.js
   npm run wissensbasis
   ```

   (`scripts/chatbot-wissensbasis.js` ersetzt nur den Teil zwischen `<!-- AUTO:FELDREFERENZ:START -->` und `END`; Agentur-Beschreibungen aus `src/lib/fieldDescriptions.json`.)

6. **Stand-Datum** im Kommentar oben auf heute setzen.

7. **Testen** mit dem Bot-Modell (`claude-haiku-4-5-20251001`, `ANTHROPIC_API_KEY` aus `.env`, nie ausgeben): temporäres Script im Scratchpad, System-Prompt wie in `src/routes/api/chat/+server.ts` (Basis-Prompt + `WISSENSBASIS:` + Schlussregeln), Wissensbasis = Text der HTML-Datei (Überschriften als `#`, Listen als `- `). 4–6 Fragen zu den Neuerungen, je eine auf Deutsch und Englisch, plus eine Frage, die nicht in der Wissensbasis steht (muss auf die Kontaktseite verweisen). Falsche Antworten → Text präzisieren und erneut testen. Eine Frage zu den Begriffen («Was ist ein Inhalts-Typ?») gehört immer dazu.

8. **Bericht an den User** (Deutsch, kurz): welche Abschnitte neu/geändert, was von der Anleitungs-Seite übernommen wurde (und gemeldete Widersprüche), Testergebnis, Grösse (Wörter), und der Hinweis zum Übernehmen: Datei im Browser öffnen (`file:///…/docs/chatbot-wissensbasis.html`, nicht über den Dev-Server) → Ctrl+A, kopieren → Prismic Einstellungen → «Chat-Bot Wissensbasis» → einfügen → veröffentlichen. Nichts committen.
