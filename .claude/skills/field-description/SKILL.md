---
name: field-description
description: Schreibt für ein oder mehrere Prismic-Felder eine vertiefte, für Redakteure optimierte Beschreibung in DE und EN (mit Beispielen, wo sinnvoll) und trägt sie direkt in src/lib/fieldDescriptions.json ein (Prismic-Feldreferenz, /agency/feldreferenz). Verwenden, wenn der User eine Feldbeschreibung verlangt (z.B. «Beschreibung für Startzeit», «Buchungsintervall») oder /field-description aufruft.
---

# Feldbeschreibung für die Prismic-Feldreferenz

Die Beschreibungen erscheinen in der Feldreferenz für Website-Betreiber (`/prismic-feldreferenz`, im Admin unter «Hilfe») und im Agentur-Editor `/agency/feldreferenz`. Leser sind **Redakteure**, keine Entwickler.

## 1. Feld finden

```sh
node -e "const r=require('./src/lib/generated/prismic-field-reference.json');
for (const f of r) if (/SUCHBEGRIFF/i.test(f.label + ' ' + f.field)) console.log(f.customType + '.' + f.field, '|', f.type, '|', f.label, '|', f.elementType)"
```

- Schlüssel = `<Custom Type oder Slice-Ordner>.<Feld-API-ID>`, z.B. `arbeitstag.startzeit`, `Kontakt.app`. Ein Slice-Feld gilt für alle Variationen.
- Mehrere Treffer (z.B. «Ort» in mehreren Typen) → beim User nachfragen, welches gemeint ist, oder alle passend beschreiben, wenn klar.
- Fehlt die Referenz: `node scripts/build-customtypes.js`.

## 2. Verhalten im Code prüfen (Pflicht, nichts erfinden)

- Feldkonfiguration lesen: Quelle des Modells (`src/lib/slices/<Slice>/base.json`, `customtypes/_features/…`, `customtypes/<typ>/base.json`) → Label, Typ, Optionen, Platzhalter, Standardwert.
- Verwendung suchen: `grep -rn "<api_id>" src netlify --include=*.ts --include=*.svelte | grep -v prismicio-types` und die betroffenen Stellen lesen.
- Genau festhalten: Was bewirkt das Feld auf der Website / in E-Mails? Was passiert, wenn es leer ist (Standard, Fallback)? Einheiten, Format (z.B. HH:MM, Minuten, %), Grenzen, Zeitzone, Sprache, Zusammenspiel mit anderen Feldern.
- **Stimmt das Verhalten nicht mit der Erwartung überein (Fehler im Code):** nicht beschönigen, sondern dem User melden und eine Korrektur anbieten. Die Beschreibung erst schreiben, wenn klar ist, welches Verhalten gilt.
- **Auffälligkeiten sammeln** — alles, was bei dieser kurzen Prüfung auffällt und verbessert werden sollte, auch wenn es nicht direkt zur Beschreibung gehört. Beispiele aus früheren Prüfungen: Zeitzone vom Server statt vom Arbeitstag (Vorlaufzeit), Datum als Mitternacht UTC (Anmeldeschluss schliesst zu früh), «Monatlich» verrutscht bei Monatsenden, Feld wird nur angezeigt statt ausgewertet («Zeitzone» bei Events), Label passt nicht zum Verhalten («Anzahl Wiederholungen» zählt den ersten Tag mit), fehlende Validierung, Standardwert im Modell weicht vom Code ab, nicht übersetzter Text, irreführender Platzhalter. Nur melden, nicht ungefragt ändern.

## 3. Beschreibung schreiben

**DE (`de-ch`):**

- du-Form, einfache Sprache, Schweizer Schreibweise (ss statt ß), 1–4 Sätze.
- Zuerst _wozu_ das Feld dient, dann _wie_ ausfüllen, dann Besonderheiten (leer = …, Grenzen).
- Begriffe für Redakteure: Inhalts-Typ (für Page/Custom Type), Inhalts-Element (für Slice); Felder, Knöpfe und Optionen in «» genau wie in Prismic.
- **Beispiel einbauen, wo es hilft:** Format (`09:00`), Rechnung (Start 09:00, Intervall 30 → 09:00, 09:30 …), typische Werte, Platzhalter (`{{Name}}`).
- Keine Technik (API-IDs, Dateinamen, UTC …), ausser sie ist für die Eingabe nötig.

**EN (`en-us`):**

- Gleicher Inhalt, natürliches Englisch.
- Feld- und Optionsnamen bleiben deutsch in «», bei Bedarf mit Übersetzung in Klammern: «Wöchentlich» (weekly).

## 4. Eintragen

```sh
node -e "
const fs=require('fs');const file='src/lib/fieldDescriptions.json';const d=JSON.parse(fs.readFileSync(file,'utf8'));
d['<KEY>']={'de-ch':'<DE>','en-us':'<EN>'};
const sorted=Object.fromEntries(Object.keys(d).sort((a,b)=>a.localeCompare(b)).map(k=>[k,d[k]]));
fs.writeFileSync(file, JSON.stringify(sorted,null,'\t')+'\n');"
```

- Bestehende Einträge anderer Felder nie entfernen; einen bestehenden Eintrag dieses Felds nur ersetzen, wenn der User das will (sonst vorher zeigen).
- Bei Feldern, die zusammengehören (Start-/Endzeit, Von/Bis, Wiederholung + Anzahl), anbieten, die Geschwister gleich mitzubeschreiben — einheitlicher Stil.

## 5. Bericht an den User

- Den DE-Text zeigen (EN nur erwähnen), kurz woher die Angaben stammen (Datei/Logik).
- **Auffälligkeiten immer melden** (siehe 2), als eigener Block «Beim Prüfen aufgefallen», pro Punkt: was passiert heute (mit konkretem Beispiel, z.B. «Termin 10:00 → Vorlauf greift erst um 12:00»), warum es stört, Vorschlag zur Verbesserung, ungefähre Grösse (Kleinigkeit / mittel). Danach fragen, ob die Punkte umgesetzt werden sollen. Ist nichts aufgefallen, das kurz sagen.
- Hinweis: `src/lib/fieldDescriptions.json` ist Kern → auf `main` committen und in die Kunden-Branches mergen; für die Chat-Bot-Wissensbasis danach `npm run wissensbasis`. Nichts committen.
