---
name: commit
description: Committet die aktuellen Änderungen nach der Git-Strategie (Kern auf main, danach main in den Ursprungs-Branch mergen, slicemachine.config.json schützen, Build prüfen, pushen). Nur über /commit aufrufen.
disable-model-invocation: true
argument-hint: '[Commit-Text]'
---

# Committen nach Git-Strategie

Grundlage: `docs/git-strategie.md`. Antworten auf Deutsch, kurz. Der Aufruf von `/commit` ist die
ausdrückliche Erlaubnis, für diesen Ablauf Branches zu wechseln, zu committen, zu mergen und zu pushen —
**nur** für diesen Ablauf, nicht darüber hinaus.

`$ARGUMENTS` = Commit-Text (optional).

## 0. Ausgangslage

```sh
git branch --show-current          # = Ursprungs-Branch (merken)
git status --short
grep -E '"plan"' slicemachine.config.json
git config --get merge.ours.driver # muss "true" sein
grep slicemachine .gitattributes   # muss "slicemachine.config.json merge=ours" sein
```

- **Schutz fehlt** (`merge.ours.driver` oder `.gitattributes`): einrichten
  (`git config merge.ours.driver true`, Zeile in `.gitattributes`), dem User melden.
- **Keine Änderungen:** abbrechen, melden.
- **Laufender Merge/Rebase/Cherry-Pick** (`git status`): abbrechen, dem User zeigen.
- **`slicemachine.config.json` geändert:** gehört nie nach `main`. Nachfragen, ob sie im
  Ursprungs-Branch committet werden soll (eigener Commit, nur dort) oder verworfen wird.
- Bei Unklarheit zum Ursprungs-Branch (`*-staging`, unbekannter Name): nachfragen.

## 1. Kern oder Kunde?

| Ursprungs-Branch                         | Vorgehen                                                       |
| ---------------------------------------- | -------------------------------------------------------------- |
| `main`                                   | direkt Schritt 2, Schritte 3 (Merge) entfällt                  |
| Plan `basis`/`professional` (z.B. nadja) | alles ist Kern → auf `main` committen                          |
| Plan `individuell` oder `klap-web-ch`    | **nachfragen** (Dateiliste zeigen): Kern, Kunde oder gemischt? |

- **Kunde:** auf dem Ursprungs-Branch committen, kein Wechsel, weiter bei Schritt 4.
- **Gemischt:** Dateien/Hunks aufteilen (Rückfrage, welche wohin). Kunden-Teil zuerst auf dem
  Ursprungs-Branch committen, dann den Kern-Teil wie unten nach `main`. Nie ein gemischter Commit.

## 2. Auf main committen

Commit-Text: `$ARGUMENTS`; fehlt er → aus `git diff` einen kurzen deutschen Text vorschlagen
(Betreffzeile + Stichpunkte, Stil wie `git log --oneline -10`) und **auf OK warten**.
Immer mit Zeile `Co-Authored-By:` gemäss System-Hinweis abschliessen.

Wechsel vom Ursprungs-Branch nach `main`:

```sh
git stash push --include-untracked -m "commit-skill" -- . ':(exclude)slicemachine.config.json'
git checkout main
git stash pop
```

- `checkout` scheitert an untracked Dateien: nur **generierte** Reste (`model.json` ohne weitere
  Dateien im Slice-Ordner, `customtypes/<typ>/index.json` ohne Quelle, `src/lib/generated/`,
  `static/fonts/`) löschen, alles andere dem User zeigen.
- Konflikte beim `stash pop`: lösen (Ursprungs-Änderung ist gewollt), Gründe melden; Stash erst
  nach Erfolg droppen.
- Prüfen, dass `slicemachine.config.json` auf `main` unverändert ist (`git diff main -- slicemachine.config.json` leer).

```sh
git add -A -- . ':(exclude)slicemachine.config.json'
git status --short   # kontrollieren: nur beabsichtigte Dateien, keine generierten (gitignored)
git commit -F <datei-im-scratchpad>
```

## 3. Zurück und main mergen

```sh
git checkout <ursprung>
cp slicemachine.config.json <scratchpad>/smc-backup.json
git merge --no-ff main
```

- **Danach immer:** `git diff <scratchpad>/smc-backup.json slicemachine.config.json` — muss leer
  sein. Sonst Backup zurückkopieren und in den Merge-Commit aufnehmen (`merge=ours` greift nur,
  wenn beide Seiten die Datei geändert haben).
- **Konflikte** lösen nach `docs/git-strategie.md` und dem Abschnitt «3. Mergen» in
  `.claude/skills/kunden-merge/SKILL.md`; generierte Dateien nie von Hand mergen, sondern neu
  erzeugen (`node scripts/build-customtypes.js`). Pro Datei Grund + Lösung notieren.
- Unklare Konflikte (Kundencode vs. Kern, Inhalt fachlich widersprüchlich): **nachfragen**, nicht raten.

## 4. Build prüfen

```sh
node scripts/build-customtypes.js
npm run build 2>&1 | tail -60
npx svelte-check --threshold error 2>&1 | tail -30
```

- Bekannte, schon vorher vorhandene Fehler (z.B. `netlify-honeypot`) ignorieren — mit
  `git stash`-freiem Vergleich: nur Fehler in geänderten/gemergten Dateien zählen.
- Fehler beheben:
  - **Kern-Datei** (auch auf `main` vorhanden, Plan basis/professional immer): Fix auf `main`
    committen (Schritt 2 wiederholen, Text «Build-Fix: …»), dann erneut Schritt 3.
  - **Kundencode:** im Ursprungs-Branch committen.
- Build erneut, bis fehlerfrei. Warnungen von `check-i18n-keys` / `check-translations` melden.

## 5. Pushen

```sh
git push origin main            # nur wenn auf main committet wurde
git push origin <ursprung>
```

Push abgelehnt (Remote neuer): `git pull --no-rebase`, Konflikte wie in Schritt 3 (inkl.
`slicemachine.config.json`-Prüfung), erneut Build, dann pushen. **Nie `--force`.**

## 6. Rückmeldung

Kurz melden:

- Commits (SHA + Betreff) auf welchen Branches, gepusht ja/nein
- Merge-Konflikte: Datei → Grund → Lösung
- Build-Fixes
- Hinweise:
  - Modelle geändert (`git diff --stat HEAD~1 -- src/lib/slices customtypes`) → `slicemachine push`
  - Dev-Server neu starten (Branch wurde gewechselt)
  - Andere Kunden-Branches haben die Kern-Änderung noch nicht → `/kunden-merge`
