# Ressource-Buchung – Anleitung für Prismic

Das Feature erlaubt es, physische Ressourcen (Ferienwohnungen, Zimmer, Räume) direkt auf der Website buchbar zu machen. Besucher wählen Anreise- und Abreisedatum, sehen die Verfügbarkeit im Kalender und füllen ein Kontaktformular aus.

---

## 1. Ressource anlegen

Im Prismic-Dashboard unter **Ressource → Neues Dokument erstellen**.

### Tab: Main

| Feld             | Bedeutung                             |
| ---------------- | ------------------------------------- |
| **UID**          | URL-Slug, z.B. `ferienhaus-tessin`    |
| **Bezeichnung**  | Anzeigename, z.B. „Ferienhaus Tessin" |
| **Beschreibung** | Optionaler Fliesstext                 |
| **Hauptbild**    | Titelbild der Ressource               |

### Tab: Kapazität

| Feld                        | Bedeutung                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Maximale Personenanzahl** | 0 = unbegrenzt                                                                                                                                   |
| **Schlafzimmer** (Gruppe)   | Beliebig viele Zimmer anlegen, je mit Bezeichnung, Betttyp (Doppelbett / Einzelbett / Stockbett / Schlafsofa), Anzahl Betten und optionalem Bild |

Sind Schlafzimmer erfasst, können Gäste im Buchungsformular konkrete Zimmer auswählen. Überschneidungen werden dann auf Zimmer-Ebene geprüft (mehrere Buchungen parallel möglich, solange verschiedene Zimmer frei sind).

### Tab: Preise & Regeln

| Feld                           | Bedeutung                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Preis pro Nacht (CHF)**      | Basispreis, gilt wenn keine Saison zutrifft                                                                                      |
| **Mindestaufenthalt (Nächte)** | Leer oder 1 = keine Einschränkung                                                                                                |
| **Check-in Tage**              | Täglich / Nur Freitag / Nur Samstag / Freitag & Samstag                                                                          |
| **Saisonpreise** (Gruppe)      | Für jede Saison: Bezeichnung, Von, Bis und Preis pro Nacht. Die erste Saison, deren Zeitraum den gebuchten Tag enthält, gewinnt. |

**Beispiel Saisonpreise:**

| Bezeichnung | Von        | Bis        | Preis/Nacht |
| ----------- | ---------- | ---------- | ----------- |
| Hochsaison  | 01.07.2026 | 01.09.2026 | CHF 250     |
| Nebensaison | 01.11.2026 | 01.03.2027 | CHF 120     |

### Tab: Kontakt

Optionale Felder für Ansprechperson, Telefon und E-Mail der Ressource (nur intern sichtbar).

### Tab: Inhalt

Slice-Zone für die Detailseite der Ressource. Hier den **RessourceBuchung**-Slice platzieren (siehe Abschnitt 3).

---

## 2. Einstellungen für E-Mail-Versand

Im Prismic-Dashboard unter **Einstellungen → Allgemein**:

| Feld                         | Bedeutung                                                                  |
| ---------------------------- | -------------------------------------------------------------------------- |
| **E-Mail**                   | Empfängeradresse für eingehende Buchungsbenachrichtigungen                 |
| **Buchungs-Absenderadresse** | Absenderadresse für automatische E-Mails (muss in Resend verifiziert sein) |

Nach jeder Buchung werden automatisch zwei E-Mails versendet:

- **Bestätigung an den Gast** mit Buchungsdetails
- **Benachrichtigung an den Anbieter** mit Kontaktdaten des Gastes

---

## 3. RessourceBuchung-Slice platzieren

Den Slice kann man sowohl auf der **Ressource-Detailseite** als auch auf jeder normalen **Seite** einsetzen.

### Pflichtfeld

| Feld          | Bedeutung                                                      |
| ------------- | -------------------------------------------------------------- |
| **Ressource** | Verlinkung auf das Ressource-Dokument, das gebucht werden soll |

### Optionale Felder

| Feld                                | Bedeutung                                         |
| ----------------------------------- | ------------------------------------------------- |
| **Überschrift**                     | Titel des Buchungsbereichs, z.B. „Jetzt anfragen" |
| **Einleitung**                      | Kurzer Text vor dem Kalender                      |
| **Senden-Schaltflächen-Text**       | Standard: „Jetzt anfragen"                        |
| **Erfolgsmeldung Titel / Text**     | Wird nach erfolgreicher Buchung angezeigt         |
| **Hintergrundfarbe / Schriftfarbe** | Überschreibt die Seitenfarbe                      |
| **Animation**                       | Einblend-Animation beim Scrollen                  |

---

## 4. Buchungen verwalten

Alle eingegangenen Buchungen sind im Admin-Bereich sichtbar:

```
/admin/ressource-buchungen?secret=ADMIN_SECRET
```

Die Liste zeigt pro Ressource: Anreise, Abreise, Anzahl Nächte, Personen, Preis, gebuchte Zimmer, Kontaktdaten und Buchungszeitpunkt. Vergangene Buchungen werden ausgegraut dargestellt. Einzelne Buchungen können über den „Löschen"-Button entfernt werden.

---

## 5. Häufige Fragen

**Kann dieselbe Ressource auf mehreren Seiten verlinkt sein?**  
Ja. Das Feld „Ressource" im Slice bestimmt, welche Ressource gebucht wird — mehrere Seiten können auf dieselbe Ressource zeigen.

**Was passiert bei einer Doppelbuchung?**  
Das System prüft Überschneidungen serverseitig. Ohne Zimmerauswahl wird jede Überschneidung abgelehnt. Mit Zimmerauswahl kann dasselbe Objekt parallel gebucht werden, solange verschiedene Zimmer gewählt werden. Der Gast erhält eine Fehlermeldung und kann andere Daten wählen.

**Wie werden Preise berechnet?**  
Nacht für Nacht: Für jeden Tag im gebuchten Zeitraum wird geprüft, ob eine Saisonregel zutrifft. Andernfalls gilt der Basispreis. Der Gesamtpreis erscheint im Buchungsformular vor dem Absenden.

**Das Buchungsformular zeigt keine Zimmerauswahl.**  
Die Zimmerauswahl erscheint nur, wenn im Ressource-Dokument unter **Kapazität → Schlafzimmer** mindestens ein Eintrag vorhanden ist.

---

## 6. Automatische E-Mails & Test-URLs

Alle Test-URLs funktionieren lokal (`http://localhost:5173`) und auf Production. `ADMIN_SECRET` aus `.env` einsetzen.

### Übersicht

| #   | E-Mail                                | Auslöser                                | Prismic-Feld                |
| --- | ------------------------------------- | --------------------------------------- | --------------------------- |
| 1   | Buchungsanfrage → Betreiber           | Gast sendet Formular ab                 | —                           |
| 2   | Buchungsbestätigung → Mieter          | Admin bestätigt Buchung                 | `buchungsbestaetigung_text` |
| 3   | Ankunfts-Erinnerung → Mieter          | Scheduler 08:00 UTC, 2 Tage vor Anreise | `reminder_text`             |
| 4   | Nach-Ankunft-Mail → Mieter            | Scheduler 08:00 UTC, 1 Tag nach Anreise | `nach_ankunft_text`         |
| 5   | Abreise-Erinnerung → Mieter           | Scheduler 20:00 UTC, 1 Tag vor Abreise  | `abreise_text`              |
| 6   | Check-in Benachrichtigung → Betreiber | Gast checkt ein                         | —                           |
| 7   | Abrechnung freigeben → Betreiber      | Admin checkt aus                        | —                           |

Fehlende Prismic-Felder → E-Mail wird übersprungen (kein Fehler, kein Versand).

### Test-URLs

**Buchungsbestätigung erneut senden** (ersetzt Mail #2):

```
/api/bestaetige-buchung?id=BUCHUNGS_ID&secret=ADMIN_SECRET&resend=true
```

**Ankunfts-Erinnerung simulieren** (Mail #3) — `dryRun=true` zeigt nur JSON, ohne `dryRun` wird wirklich gesendet:

```
/api/test-reminder?secret=ADMIN_SECRET&type=ankunft&date=YYYY-MM-DD&dryRun=true
```

`date` = Anreisetag der Buchung (Feld `von`), z.B. `2026-08-31`

**Nach-Ankunft-Mail simulieren** (Mail #4):

```
/api/test-reminder?secret=ADMIN_SECRET&type=nach_ankunft&date=YYYY-MM-DD&dryRun=true
```

`date` = Anreisetag der Buchung (= Datum des Einzugs)

**Abreise-Erinnerung simulieren** (Mail #5):

```
/api/test-reminder?secret=ADMIN_SECRET&type=abreise&date=YYYY-MM-DD&dryRun=true
```

`date` = Abreisedatum der Buchung (Feld `bis`)

**Abrechnung freigeben** (Mail #7):

```
/api/freigabe-abrechnung?id=BUCHUNGS_ID&secret=ADMIN_SECRET
```

### Scheduler lokal testen

Mit `DATE_OVERRIDE` kann das heutige Datum simuliert werden, z.B. um zu prüfen ob der Scheduler für ein bestimmtes Datum korrekt feuert:

```bash
DATE_OVERRIDE=2026-08-29 netlify functions:invoke send-reminders
```

Das simuliert: „Heute ist 29.08 → sende Reminders für Ankünfte am 31.08."

### Token-Platzhalter in E-Mail-Texten (Prismic Rich Text)

| Token                  | Wert                                                 |
| ---------------------- | ---------------------------------------------------- |
| `{{Name}}`             | Name des Gastes                                      |
| `{{Anreise}}`          | Anreisetag (DD.MM.YYYY)                              |
| `{{Abreise}}`          | Abreisetag (DD.MM.YYYY)                              |
| `{{Türcode}}`          | Env-Var `DOOR_CODE` oder `DOOR_CODE_<UID>`           |
| `{{Buchungsreferenz}}` | 6-stelliger Code (z.B. `HPRUS3`)                     |
| `{{WhatsApp}}`         | WhatsApp-Button (aus Einstellungen → `whatsapp_tel`) |
