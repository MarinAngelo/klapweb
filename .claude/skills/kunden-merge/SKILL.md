---
name: kunden-merge
description: Merged main (Kern) in einen Kunden-Branch (z.B. movingtouch, christin, zfdy, menashealers, campelli, nadja, verusmotus) — Vorprüfung, optional Pixelvergleich vorher/nachher, Merge ohne Commit, Konflikte nach Projektregeln lösen, Nachkontrolle (Custom Types, Prismic-Push, Typen, Inhalte). Verwenden, wenn der User «main in <Kunde> mergen», «Kunden-Branch aktualisieren» o. ä. verlangt oder /kunden-merge aufruft.
---

# Kunden-Branch mit main mergen

Grundlage: `docs/git-strategie.md` (main fliesst nach unten; aus Kunden-Branches nie nach main mergen).
Antworten auf Deutsch, kurz. **Nie committen, pushen oder Branch wechseln** — das macht der User.

## 1. Ausgangslage prüfen

```sh
git branch --show-current
git status --short
git log --oneline -1 main; git log --oneline HEAD..main | wc -l   # Commits, die kommen
grep plan slicemachine.config.json                                  # Plan des Kunden
```

- **Falscher Branch:** stoppen und den User bitten, selbst auf den Kunden-Branch zu wechseln (`git checkout <kunde>`). Nicht selbst wechseln.
- **`main` selbst oder `klap-web-ch`/`*-staging`:** kein Kunden-Merge → nachfragen.
- **Offene Änderungen (`M`/`A`/`D`):** stoppen, dem User zeigen, er entscheidet (committen oder stashen).
- **Nur untracked Reste generierter Dateien** (`customtypes/<typ>/` mit nur `index.json`, `src/lib/generated/`, `src/lib/slices/<X>/model.json` ohne weitere Dateien, `static/fonts/`): stammen vom vorherigen Branch, sind auf `main` gitignored → löschen, sonst bricht der Merge ab. Vorher prüfen, dass im Ordner wirklich nur generierte Dateien liegen.

## 2. Pixelvergleich anbieten (vorher)

Nur bei **movingtouch, christin, zfdy** (Designs abgenommen) — bei menashealers nicht (Design nicht final). Nachfragen, nicht ungefragt starten. Ablauf, wenn gewünscht:

1. Zwei temporäre Worktrees im Scratchpad: Stand des Kunden-Branches und Kunden-Branch + Test-Merge von main (`git worktree add`, im zweiten `git merge --no-commit main`, **nichts committen/pushen**).
2. In beiden `node_modules` als Symlink; im `vite.config.js` des Worktrees `server.fs.allow` um den Projekt-Root ergänzen. `.env` kopieren.
3. Beide als Dev-Server auf eigenen Ports (gleiches Kunden-Prismic-Repo).
4. Alle Seiten aus `/sitemap.xml` mit Headless-Chrome (CDP) Desktop 1280 px und Mobil 390 px screenshotten; `prefers-reduced-motion: reduce` emulieren und einmal durchscrollen (Reveal-Animationen), Cookie-Banner wegklicken.
5. Pixelweise vergleichen (PIL), Seiten mit Abweichung > 0,5 % mit Differenzbild melden.
6. Worktrees und Dev-Server danach wieder entfernen (`git worktree remove`).

## 3. Mergen (ohne Commit)

```sh
git merge --no-ff --no-commit main
```

So bleibt das Committen beim User. Konflikte lösen nach diesen Regeln:

| Datei                                                                                         | Regel                                                                                                    |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `slicemachine.config.json`                                                                    | **immer Kunden-Version** (Plan, Repo). Der post-merge-Hook stellt sie wieder her; trotzdem prüfen.       |
| `gating.json`                                                                                 | Kern-Struktur von main übernehmen, kundenspezifische Einträge (z.B. Plan in `features.*.plans`) behalten |
| `translations.ts`, `customtypes/page/base.json`, `.gitignore`                                 | beide Seiten vereinen (Union), keine Einträge verlieren                                                  |
| generierte Dateien (`model.json`, `customtypes/*/index.json`, `prismic-field-reference.json`) | nicht von Hand lösen: Version von main nehmen bzw. löschen, danach neu erzeugen (Schritt 4)              |
| Kunden-eigene Dateien (individuell-Branches)                                                  | Kunden-Version behalten, Kern-Änderungen von main von Hand nachziehen und dem User zeigen                |
| alles andere                                                                                  | main übernehmen, ausser der Branch hat dort bewusst eine Kunden-Anpassung (git log der Datei prüfen)     |

Nach dem Lösen: keine Konfliktmarker mehr (`git grep -nE '^(<<<<<<<|>>>>>>>)'`), Dateien nur stagen (`git add`), **nicht committen**.

## 4. Nachkontrolle

```sh
node scripts/build-customtypes.js        # Modelle für den Kunden-Plan neu erzeugen
git status --short customtypes/ src/lib/slices/
```

- **Custom Types / Felder:** Welche Typen erzeugt bzw. entfernt das Script? Entfernt es einen Typ, den das Kunden-Repo in Prismic hat, würde `slicemachine push` ihn **löschen** → stoppen, Ursache klären (Plan, `gating.json`, `gating.overrides.json` — Schalter gelten pro Prismic-Repo).
- **`slicemachine push` nötig?** Wenn sich Slice-Modelle oder Custom Types geändert haben → dem User sagen (er pusht).
- **Typprüfung:** `npx svelte-check --threshold error --output machine | grep -c ERROR` vor und nach dem Merge vergleichen (vorher per `git stash`); nur neue Fehler melden.
- **Inhalte:** `node scripts/check-translations.js` (fehlende Übersetzungen, Link- und Token-Probleme im Kunden-Repo) und Hinweis auf `/admin/inhalte`.
- **Kurztest:** Dev-Server starten (`npm run dev` ist beim User), Startseite + 2–3 Seiten mit `curl -s -o /dev/null -w "%{http_code}"` → 200.
- **Pixelvergleich (nachher)**, falls in Schritt 2 gewählt: mit dem Ergebnis des echten Merges wiederholen.

## 5. Bericht an den User

Kurz und auf Deutsch:

- welcher Branch, wie viele Commits von main übernommen
- Konflikte: welche Dateien, wie gelöst
- Custom Types / Slices geändert → `slicemachine push` nötig ja/nein
- Typprüfung (neu/alt), Inhalts-Prüfung, Pixelvergleich (falls gemacht)
- nächster Schritt für den User: Änderungen ansehen, `git commit` (Merge abschliessen), pushen; bei Problemen `git merge --abort`
