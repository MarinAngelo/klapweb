# Ressource-Buchung – Anleitung für Prismic und Admin

Das Feature macht physische Ressourcen wie Ferienwohnungen, Zimmer oder Räume direkt auf der Website buchbar. Besucher wählen Anreise- und Abreisedatum, sehen die Verfügbarkeit im Kalender, wählen bei Bedarf Zimmer aus und senden eine Anfrage.

Der Ablauf ist statusbasiert:

```text
Anfrage
→ Bestätigt
→ Eingecheckt
→ Vor Abreise E-Mail an Mieter
→ Ausgecheckt
→ Abrechnung freigeben
→ Abgerechnet
```

Zusätzlich können Aufgaben mit Credits verknüpft werden. Diese reduzieren die definitive Abrechnung.

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

| Feld                        | Bedeutung                                                                         |
| --------------------------- | --------------------------------------------------------------------------------- |
| **Maximale Personenanzahl** | 0 = unbegrenzt                                                                    |
| **Schlafzimmer**            | Beliebig viele Zimmer mit Bezeichnung, Betttyp, Anzahl Betten und optionalem Bild |

Sind Schlafzimmer erfasst, können Gäste im Buchungsformular konkrete Zimmer auswählen. Überschneidungen werden dann auf Zimmer-Ebene geprüft.

### Tab: Preise & Regeln

| Feld                           | Bedeutung                                                 |
| ------------------------------ | --------------------------------------------------------- |
| **Preis pro Nacht (CHF)**      | Basispreis, wenn keine Saison zutrifft                    |
| **Mindestaufenthalt (Nächte)** | Leer oder 1 = keine Einschränkung                         |
| **Check-in Tage**              | Einschränkung auf zulässige Anreisetage                   |
| **Saisonpreise**               | Für jede Saison Bezeichnung, Von, Bis und Preis pro Nacht |

**Beispiel Saisonpreise:**

| Bezeichnung | Von        | Bis        | Preis/Nacht |
| ----------- | ---------- | ---------- | ----------- |
| Hochsaison  | 01.07.2026 | 01.09.2026 | CHF 250     |
| Nebensaison | 01.11.2026 | 01.03.2027 | CHF 120     |

Preise werden in **CHF** berechnet und gespeichert. Die definitive Abrechnung zeigt den freigegebenen Betrag zusätzlich in **EUR zum aktuellen Tageskurs** an.

### Tab: Kontakt

Optionale Felder für Ansprechperson, Telefon und E-Mail der Ressource (nur intern sichtbar).

### Tab: Inhalt

Slice-Zone für die Detailseite der Ressource. Hier den **RessourceBuchung**-Slice platzieren.

---

## 2. E-Mail-Templates pflegen

Die automatischen und manuellen E-Mails werden im Ressource-Dokument unter **Erinnerungen** gepflegt.

| Feld                              | Versand                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| **Vor Ankunft – E-Mail Betreff**  | Automatisch 48 Stunden vor Anreise oder manuell im Admin               |
| **Vor Ankunft – E-Mail Text**     | Inhalt der Ankunftserinnerung                                          |
| **Nach Ankunft – E-Mail Betreff** | Automatisch 24 Stunden nach Anreise                                    |
| **Nach Ankunft – E-Mail Text**    | Inhalt der Nach-Ankunft-Mail                                           |
| **Vor Abreise – E-Mail Betreff**  | Manuell im Admin vor dem Check-out; automatisch am Tag vor der Abreise |
| **Vor Abreise – E-Mail Text**     | Inhalt der Abreise-Erinnerung                                          |

Unterstützte Tokens:

```text
{{Türcode}}
{{Name}}
{{Anreise}}
{{Abreise}}
{{Buchungsreferenz}}
{{WhatsApp}}
```

Der WhatsApp-Link wird nur eingefügt, wenn in den Settings eine WhatsApp-Nummer hinterlegt ist.

---

## 3. Allgemeine E-Mail-Einstellungen

In den Einstellungen beziehungsweise den Netlify-Environment-Variablen werden die technischen Werte hinterlegt:

| Wert                 | Verwendung                                                  |
| -------------------- | ----------------------------------------------------------- |
| **E-Mail im CMS**    | Standard-Empfänger für Anbieter-Benachrichtigungen          |
| `EMAIL_FROM_ADDRESS` | Technische Absenderadresse; muss in Resend verifiziert sein |
| `EMAIL_FROM_NAME`    | Optionaler Fallback-Absendername                            |
| `INVOICE_TO_EMAIL`   | Empfänger für Check-in- und Abrechnungsbenachrichtigungen   |

Der sichtbare Firmenname für Rechnungs- und Bar-Mails kommt primär aus dem CMS-Feld **Verantwortliche Person/Firma**. `EMAIL_FROM_NAME` dient nur als Rückfall.

---

## 4. RessourceBuchung-Slice platzieren

Der Slice kann auf einer Ressource-Detailseite oder auf einer normalen Seite eingesetzt werden.

### Pflichtfeld

| Feld          | Bedeutung                                     |
| ------------- | --------------------------------------------- |
| **Ressource** | Pflichtverknüpfung auf das Ressource-Dokument |

### Optionale Felder

| Feld                                | Bedeutung                          |
| ----------------------------------- | ---------------------------------- |
| **Überschrift**                     | Titel des Buchungsbereichs         |
| **Einleitung**                      | Text vor dem Kalender              |
| **Senden-Schaltflächen-Text**       | Text der Buchungsschaltfläche      |
| **Erfolgsmeldung Titel / Text**     | Anzeige nach erfolgreicher Anfrage |
| **Hintergrundfarbe / Schriftfarbe** | Optionale optische Überschreibung  |
| **Animation**                       | Einblend-Animation beim Scrollen   |

---

## 5. Buchung verarbeiten

Alle Buchungen sind unter folgender Adresse sichtbar:

```text
/admin/ressource-buchungen?secret=ADMIN_SECRET
```

### 5.1 Anfrage bestätigen

Status: **Ausstehend**

Button:

```text
✉ Bestätigen → Bestätigungsmail an Mieter
```

Was passiert:

1. Der Status wechselt von `pending` auf `confirmed`.
2. Der Mieter erhält eine Bestätigungs-E-Mail.
3. Falls die Anreise innerhalb von 48 Stunden liegt und die Ankunftserinnerung noch nicht gesendet wurde, wird die **Vor Ankunft**-Mail direkt nachgesendet.

### 5.2 Check-in ausführen

Status: **Bestätigt**

Button:

```text
✉ Check-in → Benachrichtigung an Betreiber
```

Was passiert:

1. Der Status wechselt auf `checked_in`.
2. Der Betreiber erhält eine Check-in-Benachrichtigung.

### 5.3 Vor-Abreise-E-Mail an Mieter senden

Status: **Eingecheckt**

Solange die Abreise-Erinnerung noch nicht gesendet wurde, zeigt der Hauptbutton:

```text
✉ Vor Abreise → Abreise-Mail an Mieter
```

Was passiert:

1. Die Mail verwendet die Felder **Vor Abreise – E-Mail Betreff** und **Vor Abreise – E-Mail Text**.
2. Nach erfolgreichem Versand wird `abreiseReminderSent = true` gesetzt.
3. Der Status bleibt auf `checked_in`.
4. Danach erscheint automatisch der Check-out-Button.

Zusätzlich gibt es den kleinen ✈-Button, um die Abreise-E-Mail manuell zu senden oder erneut zu senden.

Wenn **Vor Abreise – E-Mail Text** im CMS leer ist, wird diese Mail nicht versendet.

### 5.4 Check-out ausführen

Status: **Eingecheckt**

Button nach dem Abreise-Reminder:

```text
✉ Check-out → Abrechnungsmail an Betreiber
```

Was passiert:

1. Der Status wechselt auf `checked_out`.
2. Der Betreiber erhält eine Abrechnungs-E-Mail.
3. Die E-Mail enthält einen Freigabe-Link zur definitiven Abrechnung.

### 5.5 Abrechnung freigeben

Status: **Ausgecheckt**

Button:

```text
✉ Abrechnung freigeben → Definitive Abrechnung an Mieter
```

Der Freigabelink öffnet:

```text
/api/freigabe-abrechnung?id=...&secret=ADMIN_SECRET
```

Dort wird der Betrag berechnet als:

```text
Mietpreis CHF
− erledigte Aufgaben-Credits
= berechnetes Total CHF
```

Der Betrag kann vor der Freigabe manuell angepasst werden.

Unter dem CHF-Betrag erscheint der aktuell umgerechnete EUR-Wert mit Tageskurs, beispielsweise:

```text
Entspricht derzeit ca. EUR 198.00
(1 CHF = 1.0789 EUR, Tageskurs)
```

Der EUR-Wert ist nur eine Anzeige. Rechtlich und technisch entscheidend bleibt der freigegebene CHF-Betrag.

Nach dem Freigeben:

1. Der Status wechselt auf `abgerechnet`.
2. Der freigegebene Betrag wird gespeichert.
3. Der Mieter erhält die definitive Abrechnung per E-Mail.
4. Die E-Mail zeigt CHF als Total und EUR als ungefähre Angabe zum Tageskurs.

---

## 6. Aufgaben und Credits

Aufgaben können während einer Buchung angenommen, bestätigt, abgegeben und freigegeben werden. Erledigte Aufgaben erzeugen Credits.

Der Ablauf ist:

```text
Aufgabe angenommen
→ Bestätigt
→ Abgegeben
→ Erledigt
```

Credits reduzieren den Abrechnungsbetrag. Die Berechnung erfolgt entweder:

- als festes Credit
- oder zeitbasiert über Minuten und Preis pro Nacht

Die definitive Abrechnung berücksichtigt ausschließlich Aufgaben mit Status `erledigt`.

---

## 7. Manuell eine Buchung erfassen

Im Admin-Bereich kann über **+ Neue Buchung** eine Buchung manuell angelegt werden.

Pflichtfelder:

- Ressource
- Anreise
- Abreise
- Personen
- Name
- E-Mail
- Preis CHF
- Status

Manuelle Buchungen sind sinnvoll für telefonische oder externe Buchungen.

---

## 8. Zurücksetzen und erneut senden

Über den Zurück-Button kann eine Buchung um einen Statusschritt zurückgesetzt werden.

Wenn eine Buchung auf `pending` zurückgesetzt wird, werden die Reminder-Markierungen zurückgesetzt:

- Ankunftserinnerung
- Nach-Ankunft-Mail
- Abreise-Erinnerung

Damit können diese E-Mails bei einer erneuten Bestätigung wieder korrekt ausgelöst werden.

---

## 9. Häufige Fragen

**Kann dieselbe Ressource auf mehreren Seiten verlinkt sein?**  
Ja. Das Feld „Ressource" im Slice bestimmt, welche Ressource gebucht wird — mehrere Seiten können auf dieselbe Ressource zeigen.

**Warum ist die Abreise-E-Mail nicht im Hauptablauf sichtbar?**
Bei `checked_in` ist sie sichtbar, solange sie noch nicht gesendet wurde. Nach dem Versand wechselt der Hauptbutton automatisch zu **Check-out**.

**Wird der EUR-Betrag gespeichert?**
Nein. Gespeichert wird nur der freigegebene CHF-Betrag. EUR wird zum aktuellen Tageskurs berechnet und nur angezeigt.

**Was passiert, wenn der Wechselkurs nicht verfügbar ist?**
Die CHF-Abrechnung funktioniert weiterhin. Im Formular steht, dass der EUR-Tageskurs nicht verfügbar ist; in der Mieter-Mail entfällt die EUR-Zeile.

**Was passiert bei einer Doppelbuchung?**
Das System prüft Überschneidungen serverseitig. Ohne Zimmerauswahl wird jede Überschneidung abgelehnt. Mit Zimmerauswahl ist eine parallele Buchung nur bei verschiedenen Zimmern möglich.

**Wie werden Preise berechnet?**
Nacht für Nacht: Für jeden Tag im gebuchten Zeitraum wird geprüft, ob eine Saisonregel zutrifft. Andernfalls gilt der Basispreis. Der Gesamtpreis erscheint im Buchungsformular vor dem Absenden.

**Das Buchungsformular zeigt keine Zimmerauswahl.**
Die Zimmerauswahl erscheint nur, wenn im Ressource-Dokument unter **Kapazität → Schlafzimmer** mindestens ein Eintrag vorhanden ist.

**Warum wurde eine Abreise-E-Mail nicht gesendet?**
Häufigste Ursachen:

- **Vor Abreise – E-Mail Text** fehlt im CMS
- Die Buchung hat keine E-Mail-Adresse
- `RESEND_API_KEY` oder `EMAIL_FROM_ADDRESS` ist nicht gesetzt
- Der Abreise-Reminder wurde bereits gesendet

---

## 10. Automatische E-Mails & Test-URLs

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

---

## 11. Zusammenfassung

Der aktuelle Workflow lautet:

1. Ressource und Preise im CMS pflegen.
2. E-Mail-Templates für Ankunft, Nach-Ankunft und Abreise ausfüllen.
3. `RessourceBuchung`-Slice auf einer Seite platzieren.
4. Anfrage im Admin bestätigen.
5. Check-in auslösen.
6. Vor-Abreise-E-Mail an den Mieter senden.
7. Check-out auslösen.
8. Abrechnung über den Freigabe-Link prüfen und manuell korrigieren.
9. Definitive Abrechnung in CHF mit EUR-Hinweis an den Mieter senden.
