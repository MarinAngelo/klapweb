# Git-Strategie: Kern und Kunden-Branches

Ein Repository und viele Websites: Jede Kunden-Website ist ein eigener Branch. `main` enthält den
**Kern**, also die Grundstruktur aller Features (Slices, Custom Types, Admin, E-Commerce, Aufgaben …).
Kunden-Branches bauen darauf auf.

**Neu:** Kunden-Branches mit Plan `individuell` dürfen vom Kern abweichen. Damit lassen sich Features
wie „Aufgaben“ pro Kunde anpassen. Die Anpassung baut immer auf dem Kern-Feature auf und ersetzt es nicht.

## Branch-Typen

| Typ                     | Plan (`slicemachine.config.json`) | Weicht von `main` ab?                | Richtung zu `main`                       |
| ----------------------- | --------------------------------- | ------------------------------------ | ---------------------------------------- |
| `main` (Kern)           | –                                 | –                                    | –                                        |
| Kunde Standard          | `basis`, `professional`           | Nein, nur `slicemachine.config.json` | Merge erlaubt (Code ist identisch)       |
| Kunde individuell       | `individuell`                     | Ja, kundenspezifische Anpassungen    | **Nie mergen**, nur Kern-Commits picken  |
| `klap-web-ch` (Agentur) | `klap-web-ch`                     | Ja (Katalog, Mietvertrag …)          | **Nie mergen**, nur Kern-Commits picken  |
| `*-staging`             | wie der zugehörige Branch         | wie der zugehörige Branch            | wird aus dem zugehörigen Branch gespeist |

## Grundregeln

1. **`main` fliesst nach unten.** Jeder Branch holt Kern-Updates mit `git merge main`.
2. **Nach oben fliesst nur Kern-Code.** Aus individuellen Branches und aus `klap-web-ch` gelangt nichts
   per Merge nach `main`, sondern nur einzelne Kern-Commits per `cherry-pick`.
3. **Ein Commit ist entweder Kern oder Kunde, nie beides.** Nur so lassen sich Kern-Commits sauber
   nach `main` übernehmen.
4. **Kern zuerst.** Braucht eine Kundenanpassung eine Änderung an der Grundstruktur (neues Feld,
   Erweiterungspunkt, Bugfix), kommt diese zuerst in `main`. Danach `git merge main` im Kunden-Branch,
   und erst dann wird die Anpassung darauf gebaut.
5. **Nach jedem Cherry-Pick sofort zurückmergen.** Wurde ein Commit nach `main` übernommen, im
   Ursprungs-Branch **sofort** `git merge main` ausführen, bevor auf `main` weitergearbeitet wird.
   Siehe [Warum zurückmergen?](#warum-zurückmergen).
6. **Branch nie wechseln, während gearbeitet wird.** Jeder Branch hat seine eigene
   `slicemachine.config.json`. Nach jedem Wechsel `npm run dev` neu starten, damit die Modelle für
   den Plan neu generiert werden.

```
                 ┌──────────── merge main ────────────┐
                 │                                    ▼
 main (Kern) ────┼──► Kunde Standard (basis/professional)  ◄─► main   (identischer Code)
                 ├──► Kunde individuell                     ─┐
                 └──► klap-web-ch                           ─┴─► main  nur per cherry-pick (Kern-Commits)
```

## Individualisieren, ohne den Kern zu verlassen

Ziel: `git merge main` soll im Kunden-Branch möglichst konfliktfrei bleiben. Reihenfolge der Mittel:

1. **Konfiguration statt Code:** Prismic-Inhalte, Settings, Theme, Feature-Flags in `gating.json`.
   Reicht das, ist der Branch eigentlich kein Fall für eine Abweichung.
2. **Erweiterungspunkt im Kern:** Option, Feld, Variation oder Slot in `main` ergänzen, sodass alle
   Kunden davon profitieren können. Im Kunden-Branch dann nur noch einschalten und befüllen.
3. **Neue Dateien statt geänderte Kern-Dateien:** Kundenspezifisches in eigene Dateien legen,
   z.B. eine zusätzliche Komponente oder Route. Neue Dateien erzeugen beim Merge keine Konflikte.
4. **Kern-Dateien ändern:** nur wenn nichts anderes geht, und dann klein halten. Jede Zeile hier
   ist ein möglicher Merge-Konflikt bei jedem Kern-Update.

Nicht im Kunden-Branch anpassen (immer über `main`):

- Generierte Dateien (`model.json`, `customtypes/*/index.json`, `prismic-field-reference.json`)
- Gemeinsame Strukturdateien wie `customtypes/page/base.json`, `gating.json`, `translations.ts`,
  sofern es nicht um rein kundenspezifische Einträge geht. Kundeneinträge dort am Ende eines
  Blocks einfügen, nicht mitten im Kern.

## Workflows

### Kern-Änderung (für alle Kunden)

```sh
# auf main
git commit -m "Aufgaben: Abbrechen im Anmeldedialog"
# danach in jedem Kunden-Branch
git merge main
```

### Kundenanpassung (nur dieser Kunde, Plan `individuell`)

```sh
# auf dem Kunden-Branch, z.B. campelli
git commit -m "campelli: Aufgaben mit Zusatzfeld Zimmer"
```

Die Anpassung bleibt im Kunden-Branch und geht nie nach `main`.

### Allgemeine Verbesserung, die in einem Kunden-Branch entstanden ist

1. Als **eigenen** Commit festhalten, ohne Kundencode.
2. Auf `main` übernehmen:
   ```sh
   # auf main
   git cherry-pick <sha>
   ```
3. **Sofort** zurück in den Ursprungs-Branch und `git merge main` ausführen, bevor auf `main`
   weitergearbeitet wird. Dieser Merge ist meist konfliktfrei; wurde der Commit beim Cherry-Pick
   angepasst, entsteht hier einmalig ein kleiner Konflikt, der jetzt noch leicht zu lösen ist.
   ```sh
   # auf dem Ursprungs-Branch, z.B. campelli
   git merge main
   ```

Gibt es beim Cherry-Pick Konflikte in Dateien, die es auf `main` nicht gibt, gehört der Commit
(oder Teile davon) zum Kundencode und nicht in den Kern.

### Warum zurückmergen?

Ein Cherry-Pick erzeugt auf `main` eine **Kopie** mit neuer Commit-ID. Für Git sind Original und
Kopie zwei verschiedene Commits, und der gemeinsame Stand der beiden Branches (`git merge-base`)
rückt nicht vor. Beim nächsten Merge vergleicht Git deshalb mit einem alten Stand und sieht die
Änderung auf beiden Seiten.

Solange beide Seiten exakt gleich aussehen, geht das gut. Ändert `main` dieselben Zeilen danach
weiter (z.B. ein neues Feld in einer gerade übernommenen Datei), meldet Git Konflikte in allen
diesen Dateien, obwohl inhaltlich nichts widersprüchlich ist. So geschehen im Oktober 2026:

- Teilaufgaben auf `campelli` gebaut → nach `main` kopiert → auf `main` Feld «Priorität» in
  denselben Dateien ergänzt → `git merge main` in `campelli`: Konflikte in 5 Dateien
- Warenkorb auf `klap-web-ch` gebaut → beim Kopieren nach `main` angepasst (ohne Feld `slices`)
  → `git merge main` in `klap-web-ch`: Konflikte in `leistung/index.json` und `services.ts`

Ein Merge direkt nach dem Cherry-Pick setzt den gemeinsamen Stand auf heute; spätere Änderungen
auf `main` kommen danach konfliktfrei an.

Prüfen, wie alt der gemeinsame Stand ist:

```sh
git log -1 --format='%h %cd %s' $(git merge-base HEAD main)
```

Liegt er weit zurück, obwohl kürzlich Commits nach `main` kopiert wurden: zuerst `git merge main`.

### Kunden-Branch auf `individuell` hochstufen

Nur `plan` in `slicemachine.config.json` ändern, committen, `npm run dev`, `slicemachine push`.
Ab dann gelten die Regeln für individuelle Branches.

### Neuer Kunde

```sh
git checkout -b <kunde> main
# slicemachine.config.json: repositoryName + plan setzen, committen
```

## Schutz von `slicemachine.config.json`

`.gitattributes` enthält `slicemachine.config.json merge=ours`. Dafür muss der Merge-Treiber lokal
einmal eingerichtet sein:

```sh
git config merge.ours.driver true
```

Einschränkung: `merge=ours` greift nur, wenn die Datei **auf beiden Seiten** geändert wurde. Wurde
sie nur auf der anderen Seite geändert, übernimmt Git deren Version ohne Rückfrage. Deshalb:

- Änderungen an `slicemachine.config.json` immer in einem eigenen Commit, nie zusammen mit Kern-Code
- Nach jedem Merge und Cherry-Pick prüfen: `git diff HEAD~1 -- slicemachine.config.json`

## Nützliche Befehle

```sh
# Was hat dieser Branch, das main nicht hat? (Kundencode + noch nicht übernommene Kern-Commits)
git log --oneline main..HEAD

# Welche Kern-Updates fehlen diesem Branch?
git log --oneline HEAD..main

# Inhaltliche Abweichung eines Kunden vom Kern
git diff main...<kunde> --stat

# Plan aller lokalen Branches
for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
  echo "$b: $(git show $b:slicemachine.config.json | grep -o '"plan": *"[^"]*"')"
done
```
