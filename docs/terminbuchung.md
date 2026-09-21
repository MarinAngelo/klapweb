# Buchungssystem

## Überblick

Das Buchungssystem ermöglicht es Besucherinnen und Besuchern, freie Zeitfenster aus einem oder mehreren Angeboten zu buchen. Du definierst im CMS Arbeitstage, Angebote, Dauer, Puffer und Wiederholungen. Das System erzeugt daraus automatisch buchbare Termine und verwaltet gebuchte, freie und gesperrte Slots.

Der aktuelle Aufbau besteht aus drei CMS-Typen:

- **Buchbares Angebot**: die eigentliche Leistung, zum Beispiel „Massage 60 Minuten"
- **Arbeitstag**: der Zeitraum, an dem buchbare Angebote verfügbar sind
- **Ort / Standort**: der physische Ort, an dem das Angebot stattfindet (optional)

Ein Termin im Buchungsformular entsteht aus:

```text
Arbeitstag
+ buchbare Angebote
+ Dauer und Puffer des Angebots
+ Buchungsintervall des Arbeitstags
```

Ein Angebot kann optional einen **Ort** verknüpfen. Der Ort wird in den E-Mails und im Admin-Panel angezeigt.

---

## Buchungssystem einrichten und nutzen

### 1. Buchbare Angebote anlegen

Öffne in Prismic den Custom Type **Buchbares Angebot** und erstelle eine neue Leistung.

Fülle folgende Felder aus:

| Feld                        | Bedeutung                                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UID**                     | Eindeutiger technischer Name, z.B. `massage-60`                                                                                                    |
| **Bezeichnung**             | Name des Angebots, z.B. „Massage 60 Minuten“                                                                                                       |
| **Beschreibung**            | Optionale Erläuterung                                                                                                                              |
| **Dauer (Minuten)**         | Dauer der Leistung, z.B. `60`                                                                                                                      |
| **Puffer danach (Minuten)** | Optionaler Abstand vor dem nächsten Termin, z.B. `15`                                                                                              |
| **Vorlaufzeit (Minuten)**   | Wie lange vor dem Termin nicht mehr buchbar, z.B. `60` = ab 10:00 nicht mehr buchbar bei Termin um 11:00. `0` oder leer = bis Terminbeginn buchbar |
| **Preis (optional)**        | Optionaler Preis des Angebots                                                                                                                      |
| **Aktiv**                   | Nur aktive Angebote werden als Termine erzeugt                                                                                                     |

Speichere und veröffentliche das buchbare Angebot.

**Beispiele:**

- Beratung, Dauer 30 Minuten, Puffer 10 Minuten, Vorlaufzeit 120 Minuten
- Massage, Dauer 60 Minuten, Puffer 15 Minuten, Vorlaufzeit 60 Minuten
- Erstgespräch, Dauer 45 Minuten, kein Puffer, keine Vorlaufzeit

**Optional: Ort verknüpfen**

Falls das Angebot an einem physischen Ort stattfindet, kannst du im Feld **Ort** einen Standort auswählen. Der Ort wird in den E-Mails und im Admin-Panel angezeigt.

---

### 2. Orte anlegen (optional)

Öffne in Prismic den Custom Type **Ort / Standort** und erstelle einen neuen Eintrag.

| Feld                | Bedeutung                                           |
| ------------------- | --------------------------------------------------- |
| **UID**             | Eindeutiger Name, z.B. `zuerich-city`               |
| **Name**            | Anzeigename, z.B. „Zürich City“                     |
| **Adresse**         | Vollständige Adresse                                |
| **Geo-Koordinaten** | Format `47.3769, 8.5417` (aus Google Maps kopieren) |
| **Telefon**         | Optionale Telefonnummer                             |
| **E-Mail**          | Optionale E-Mail-Adresse                            |
| **Öffnungszeiten**  | Optionale Öffnungszeiten                            |
| **Wegbeschreibung** | Optionale Wegbeschreibung                           |
| **Bild**            | Optionales Bild                                     |
| **Aktiv**           | Nur aktive Orte sind auswählbar                     |

Speichere und veröffentliche den Ort.

---

### 3. Arbeitstage anlegen

Öffne in Prismic den Custom Type **Arbeitstag** und erstelle einen neuen Eintrag.

Fülle folgende Felder aus:

| Feld                        | Bedeutung                                                           |
| --------------------------- | ------------------------------------------------------------------- |
| **UID**                     | Eindeutiger Name, z.B. `montag-praxistag`                           |
| **Bezeichnung**             | Verständlicher Name, z.B. „Praxistag Montag“                        |
| **Datum**                   | Erster Arbeitstag                                                   |
| **Startzeit (HH:MM)**       | Beginn des Arbeitstags, z.B. `09:00`                                |
| **Endzeit (HH:MM)**         | Ende des Arbeitstags, z.B. `18:00`                                  |
| **Zeitzone**                | Normalerweise `Europe/Zurich`                                       |
| **Pause von / Pause bis**   | Optionale Sperrzeit innerhalb des Tages                             |
| **Buchungsintervall**       | Rastermass der Startzeiten: 15, 30 oder 60 Minuten                  |
| **Buchbare Angebote**       | Verknüpfung auf die Angebote, die an diesem Tag buchbar sein sollen |
| **Wiederholung**            | Keine, täglich, wöchentlich, zweiwöchentlich oder monatlich         |
| **Wiederholen bis (Datum)** | Enddatum der Serie                                                  |
| **Anzahl Wiederholungen**   | Alternative zum Enddatum                                            |

Speichere und veröffentliche den Arbeitstag.

Bei einer Wiederholung werden zukünftige Arbeitstage automatisch erzeugt. Du musst nicht jede Woche einzeln anlegen.

**Beispiel:**

```text
Bezeichnung: Praxistag Montag
Datum: 20.10.2025
Startzeit: 09:00
Endzeit: 17:00
Pause: 12:00 bis 13:00
Buchungsintervall: 30 Minuten
Buchbare Angebote: Massage 60 Minuten, Beratung 30 Minuten
Wiederholung: Wöchentlich
Wiederholen bis: 31.12.2025
```

---

### 4. Admin Panel

Bevor du das Buchungsformular veröffentlichst, öffne die Terminverwaltung:

```text
/admin/buchungen?secret=DEIN_ADMIN_SECRET
```

Dort siehst du, welche konkreten Termine aus den Arbeitstagen und buchbaren Angeboten erzeugt wurden.

#### Kontrollieren

Prüfe die Liste **Freie Termine**:

- Stimmen Datum und Wochentag?
- Stimmen Start- und Endzeit?
- Erscheint die richtige Anzahl Termine?
- Wird der Puffer nach einem Angebot berücksichtigt?
- Werden Pausen korrekt ausgespart?
- Sind nur die gewünschten buchbaren Angebote sichtbar?
- Sind wiederkehrende Termine bis zum gewünschten Enddatum vorhanden?

Falls ein Termin nicht erscheint, prüfe zuerst, ob das Angebot aktiv ist, ob es beim Arbeitstag verknüpft ist und ob der Arbeitstag veröffentlicht wurde.

#### Korrekturen

Der Feinschliff erfolgt vor der Veröffentlichung:

- Einzelne Termine in der Liste **Freie Termine** sperren, wenn sie ausnahmsweise nicht buchbar sein sollen.
- Mehrere Termine auswählen und gemeinsam sperren.
- Gesperrte Termine in der Liste **Gesperrte Termine** wieder freigeben.
- Puffer oder Dauer im **Buchbaren Angebot** anpassen, wenn die Abstände nicht stimmen.
- Buchungsintervall, Pause oder Arbeitszeit im **Arbeitstag** anpassen, wenn zu viele oder zu wenige Slots entstehen.
- Nach Änderungen im CMS den Arbeitstag beziehungsweise das Angebot erneut veröffentlichen und die Terminverwaltung aktualisieren.

Erst wenn die freien Termine im Admin Panel korrekt aussehen, sollte die Buchungsseite veröffentlicht werden.

---

### 5. Buchungsformular auf einer Seite einfügen

Öffne in Prismic die Seite, auf der gebucht werden soll.

Füge den Slice **Formular** ein und wähle die Variation **Mit Termin**.

Empfohlene Formularfelder:

| Feldname   | Feldtyp  | Zweck                                                                   |
| ---------- | -------- | ----------------------------------------------------------------------- |
| `Name`     | Textfeld | Name der buchenden Person                                               |
| `E-Mail`   | E-Mail   | Empfänger der Bestätigungsmail                                          |
| `Termin`   | Termin   | Auswahl der verfügbaren Slots                                           |
| `Zeitzone` | Zeitzone | Optionale Darstellung in der Zeitzone der Besucherin oder des Besuchers |

Die Feldnamen `Name` und `E-Mail` sollten exakt so heissen, damit die Buchung und E-Mail-Benachrichtigung korrekt zugeordnet werden.

Du kannst zusätzliche Felder ergänzen, zum Beispiel Telefon, Nachricht oder Firma.

---

### 6. Formulartexte festlegen

Im Slice **Formular → Mit Termin** kannst du folgende Texte pflegen:

| Feld                          | Bedeutung                                            |
| ----------------------------- | ---------------------------------------------------- |
| **Formular Titel**            | Überschrift des Buchungsformulars                    |
| **Formular Instruktionen**    | Kurze Anleitung für die Besucherin oder den Besucher |
| **Senden-Schaltflächen-Text** | Text des Absende-Buttons, z.B. „Termin buchen“       |

Nach erfolgreicher Buchung werden Besucherinnen und Besucher auf die Bestätigungsseite `/termin-gebucht` weitergeleitet. Der Titel dieser Seite kommt aus den Settings (siehe nächster Schritt).

---

### 7. E-Mail-Benachrichtigungen konfigurieren

Öffne in Prismic den Custom Type **Settings** und den Tab **Terminbuchung**.

Pflege dort:

| Feld                           | Bedeutung                                          |
| ------------------------------ | -------------------------------------------------- |
| **Absender-E-Mail**            | Absenderadresse für Buchungsbestätigungen          |
| **Kunden-E-Mail: Betreff**     | Betreff der Bestätigungsmail                       |
| **Kunden-E-Mail: Text**        | Inhalt der Bestätigungsmail                        |
| **Buchungsbestätigung: Titel** | Titel der Bestätigungsseite, z.B. „Termin gebucht“ |

Unterstützte Platzhalter:

```text
{{Titel}}
{{Datum}}
{{Uhrzeit}}
{{Dauer}}
{{Name}}
{{Firma}}
```

Beispiel Betreff:

```text
Ihre Terminbestätigung: {{Titel}} am {{Datum}}
```

Beispiel Text:

```text
Guten Tag {{Name}}

Ihr Termin wurde erfolgreich gebucht.

Termin: {{Titel}}
Datum: {{Datum}}
Uhrzeit: {{Uhrzeit}}
Dauer: {{Dauer}}

Wir freuen uns auf Ihren Besuch.

Freundliche Grüsse
{{Firma}}
```

Damit E-Mails tatsächlich versendet werden, müssen auf dem Hosting folgende Umgebungsvariablen konfiguriert sein:

```env
RESEND_API_KEY
EMAIL_FROM_ADDRESS
```

Die Adressen werden so bestimmt:

| E-Mail                    | Quelle                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Kundenbestätigung         | Feld `E-Mail` im Formular                                              |
| Anbieter-Benachrichtigung | **E-Mail** in den CMS-Settings                                         |
| Technischer Absender      | **Absender-E-Mail** im Tab **Terminbuchung** oder `EMAIL_FROM_ADDRESS` |

Die CMS-Absender-E-Mail hat Vorrang. Falls sie leer ist, wird `EMAIL_FROM_ADDRESS` verwendet. Die Kundenadresse kommt nicht aus den Settings, sondern aus der Formulareingabe.

---

### 8. Seite veröffentlichen

Veröffentliche in dieser Reihenfolge:

1. Alle benötigten **Angebote**
2. Alle benötigten **Arbeitstage**
3. Die Seite mit dem Slice **Formular → Mit Termin**

Ein Termin erscheint auf der Website nur, wenn:

- das Feature **Terminbuchung** aktiviert ist
- mindestens ein Arbeitstag veröffentlicht ist
- der Arbeitstag mindestens ein aktives Angebot enthält
- die Seite mit dem Formular veröffentlicht ist
- das Formular ein Feld vom Typ **Termin** enthält

---

### 9. Buchung durch Besucherinnen und Besucher

Der Ablauf ist:

1. Die Person öffnet die Seite mit dem Buchungsformular.
2. Sie wählt einen freien Termin aus.
3. Sie gibt Namen und E-Mail-Adresse ein.
4. Optional wählt sie eine Zeitzone aus.
5. Sie sendet das Formular ab.
6. Das System reserviert den Termin sofort.
7. Der Termin ist danach nicht mehr für andere Buchungen verfügbar.
8. Die Person erhält eine Bestätigungsmail, sofern der E-Mail-Versand eingerichtet ist.

Wenn sich zwei Buchungen zeitlich überlappen, wird die spätere Buchung abgelehnt. Die zweite Person erhält eine Meldung, dass der Termin nicht mehr verfügbar ist.

---

### 10. Buchungen kontrollieren

Die gebuchten Termine können in der Terminverwaltung kontrolliert werden:

```text
/admin/buchungen?secret=DEIN_ADMIN_SECRET
```

Die Terminverwaltung enthält drei Bereiche:

#### Gebuchte Termine

Zeigt alle bestätigten Buchungen mit Datum, Uhrzeit, Titel, Name, E-Mail und Buchungszeitpunkt.

Eine Buchung kann gelöscht werden. Dadurch wird der Slot wieder frei.

#### Freie Termine

Zeigt alle verfügbaren Slots, die aus den veröffentlichten Arbeitstagen und Angeboten erzeugt wurden.

Ein freier Termin kann gesperrt werden.

#### Gesperrte Termine

Zeigt manuell blockierte Slots.

Ein gesperrter Termin kann wieder freigegeben werden.

---

### 11. Termine sperren oder wieder freigeben

In der Liste **Freie Termine** kannst du einen Termin sperren. Der Slot wird dann nicht mehr auf der Website angeboten.

In der Liste **Gesperrte Termine** kannst du einen Termin wieder freigeben.

Eine bestehende Buchung löschst du über **Gebuchte Termine**. Danach wird der Slot wieder buchbar.

**Achtung:** Lösche eine Buchung nur, wenn der Termin tatsächlich wieder verfügbar sein soll. Beim Löschen werden keine zusätzlichen Stornierungs-E-Mails an Kunden versendet.

---

### 12. Wiederkehrende Termine ändern

Wenn du eine Serie ändern möchtest, öffne den entsprechenden **Arbeitstag**.

Du kannst ändern:

- Startdatum
- Start- und Endzeit
- Zeitzone
- Pause
- Buchungsintervall
- verknüpfte Angebote
- Wiederholung
- Enddatum oder Anzahl Wiederholungen

Veröffentliche den Arbeitstag anschliessend erneut. Die zukünftigen Slots werden anhand der aktuellen Einstellungen erzeugt.

Bestehende Buchungen bleiben gespeichert. Änderungen sollten daher möglichst nicht kurzfristig erfolgen, wenn bereits Termine gebucht wurden.

---

## Checkliste vor der Veröffentlichung

Prüfe vor der Veröffentlichung:

- Ist das Feature **Terminbuchung** aktiviert?
- Ist mindestens ein **Buchbares Angebot** veröffentlicht und aktiv?
- Ist mindestens ein **Arbeitstag** veröffentlicht?
- Ist beim Arbeitstag mindestens ein Angebot verknüpft?
- Sind Startzeit und Endzeit korrekt im Format `HH:MM` eingetragen?
- Ist die richtige Zeitzone ausgewählt?
- Ist das Buchungsintervall sinnvoll?
- Ist bei einer Wiederholung ein Enddatum oder eine Anzahl hinterlegt?
- Verwendet das Formular die Variation **Mit Termin**?
- Gibt es ein Feld mit dem Namen `Name`?
- Gibt es ein Feld mit dem Namen `E-Mail`?
- Gibt es ein Feld mit dem Typ **Termin**?
- Ist das Feld **Termin** obligatorisch?
- Ist die Absender-E-Mail in den Settings eingetragen?
- Ist die Anbieter-E-Mail in den CMS-Settings eingetragen?
- Sind `RESEND_API_KEY` und `EMAIL_FROM_ADDRESS` auf dem Hosting eingerichtet?
- Wurden Angebote, Arbeitstage und Formularseite veröffentlicht?
- Wurde eine Testbuchung erfolgreich durchgeführt?

---

## Best Practices

### Empfohlene Planung

- Verfügbarkeiten regelmässig pflegen
- Pausen und Freitage direkt im Arbeitstag eintragen
- Puffer bei längeren Angeboten realistisch wählen
- Vorlaufzeit pro Angebot festlegen, damit Kunden nicht zu kurzfristig buchen

### Puffer vs. Vorlaufzeit

Beide werden in Minuten auf Ebene **Buchbares Angebot** konfiguriert, wirken aber unterschiedlich:

| Feld              | Wirkung                                                                    | Beispiel                                                           |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Puffer danach** | Blockiert Zeit **nach** dem Termin für den nächsten Termin                 | 60 Min. Massage + 15 Min. Puffer → nächster Slot erst nach 75 Min. |
| **Vorlaufzeit**   | Bestimmt, ab wann ein Termin **nicht mehr buchbar** ist (vor Terminbeginn) | Termin 11:00, Vorlaufzeit 60 → ab 10:00 nicht mehr buchbar         |

### Sinnvolle Intervallwahl

- Kurze Angebote: 15 oder 30 Minuten
- Klassische Termine: 30 Minuten
- Gröbere Slots: 60 Minuten

### Fehler vermeiden

- Kein Angebot beim Arbeitstag verknüpfen
- Puffer vergessen, obwohl Vorbereitungszeit nötig ist
- Alte Arbeitstage verändern, obwohl bereits Buchungen existieren
- E-Mail-Konfiguration nicht testen

---

## Fehlerbehebung

| Problem                                                     | Mögliche Ursache                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Custom Type **Buchbares Angebot** oder **Arbeitstag** fehlt | Feature **Terminbuchung** ist im Projekt nicht aktiviert                                        |
| Kein Termin wird angezeigt                                  | Arbeitstag nicht veröffentlicht, kein Angebot verknüpft oder das verknüpfte Angebot ist inaktiv |
| Formular sendet nicht                                       | Pflichtfelder unvollständig oder Feld `Termin` fehlt                                            |
| Keine Bestätigungsmail                                      | `RESEND_API_KEY` oder `EMAIL_FROM_ADDRESS` fehlt                                                |
| Keine Anbieter-Benachrichtigung                             | Anbieter-E-Mail in den CMS-Settings fehlt                                                       |
| Termin ist plötzlich nicht verfügbar                        | Er wurde gebucht, gesperrt oder überlappt mit einer bestehenden Buchung                         |
| Änderungen im CMS sind nicht sichtbar                       | Angebot, Arbeitstag oder Seite wurde nicht publiziert                                           |

---

## Kurzfassung

Für die Einrichtung genügen diese Schritte:

1. Buchbares Angebot mit Dauer und optionalem Puffer anlegen.
2. Arbeitstag mit Zeitraum, Pause, Intervall und Angeboten anlegen.
3. Auf einer Seite den Slice **Formular → Mit Termin** einfügen.
4. Felder `Name`, `E-Mail` und `Termin` konfigurieren.
5. E-Mail-Texte in den Settings pflegen.
6. Hosting-Umgebungsvariablen prüfen.
7. Alle CMS-Einträge und die Seite veröffentlichen.
8. Eine Testbuchung durchführen.
