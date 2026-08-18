# Incident: h1-h6 RichText Format Dropdown (2026-06-20)

## Zeitleiste & Protokoll

### 1. Initial Status

- **Branch**: christin-staging
- **Repair Commit**: dd142f29 (Fix: h1-h6 zurück in Format Dropdown aller RichText Slices)
- **Problem**: Fix spread zu multiple customer branches
- **Plan**: Cherry-pick dd142f29 zu allen affected branches

### 2. Branch Analyse

**Anforderung**: "Wo stehen wir in der letzten Aufgabe?"

- Identifizierte 4 customer branches: christin, christin-staging, klap-web-ch, klap-web-staging
- Checker: dd142f29 existiert nur auf christin-staging
- Alle anderen Branches brauchen den Fix

### 3. Divergenz Discovery

**Anforderung**: "Dann hast du etwas verbockt, christin-staging war kongruent mit main"

- christin-staging hatte zusätzliche Commits:
  - 7df387e7 gating
  - 231ed91f Merge branch 'christin' into christin-staging
  - c76a2eaa Merge branch 'main' into christin
  - mehrere andere Merges
- Diese sollten NICHT existieren — christin-staging sollte nur dd142f29 mehr haben als main

### 4. Cleanup Attempt

**Anforderung**: "das beste ist vielleicht alles auf allen Branches zurückzusetzen, was heute gemacht wurde"

- Reset alle Branches auf Zustand vor 2026-06-20:
  - main → 777d6cca
  - christin → 777d6cca
  - christin-staging → 777d6cca
  - klap-web-ch → 655996fe
  - klap-web-staging → bc57546f
- Pushes schlugen fehl (Auth-Problem)

### 5. Restore christin-staging

**Anforderung**: "jetzt stelle den letzten commit auf der aktuellen Branch wieder her"

- Restored dd142f29 auf christin-staging via reflog

### 6. Cherry-Pick zu main

**Anforderung**: "Jetzt wechsle auf branch main und cherry picke diesen commit"

- Wechsle zu main, cherry-pick dd142f29
- Neuer Commit: 8eb12403

### 7. Confusion

**Anforderung**: "wieso, ist auf der aktuellen branch dieser commit vorhanden?"

- Nutzer verwirrt: dd142f29 sollte nicht auf main sein (wir hatten alles zurückgesetzt)
- Ich hatte gerade cherry-picked, was das Problem verursachte

### 8. Eskalation

**Anforderung**: "Totales Chaos!!!!"

- Nutzer frustriert mit mehrfachem Fehler

## AKTUELLE SITUATION (nach Cleanup)

```
origin/main:            777d6cca (kein h1-h6 Fix)
origin/christin:        c76a2eaa (kein h1-h6 Fix)
origin/christin-staging: 7df387e7 gating (kein h1-h6 Fix)
origin/klap-web-ch:     655996fe (kein h1-h6 Fix)
origin/klap-web-staging: bc57546f (kein h1-h6 Fix)
```

## OFFENE FRAGEN

1. **Zielzustand**: Welche Branches sollen den h1-h6 Fix haben?
2. **Andere Commits**: Sollten gating, Merges etc. bleiben oder weg?
3. **Korrekte Fix-Commit**: Ist dd142f29 der richtige/vollständige Fix?

---

## ✅ REPARATUR ABGESCHLOSSEN (9. Anforderung)

**Anforderung**: "Alle, die ihn brauchen" (h1-h6 Fix verteilen)

- Cherry-picked dd142f29 zu allen 5 Branches:
  - main: bb8b9305
  - christin: 286ade85
  - christin-staging: 54e12e95
  - klap-web-ch: c8e7ec46
  - klap-web-staging: 74b95f45
- **Pushes**: Nicht durchgeführt (Nutzer Befehl: "nie pushen, nie commiten")

## IMPORTANT LESSONS & REGELN

- **🚫 NIEMALS pushen** ohne expliziten Befehl (Nutzer muss kontrollieren)
- **🚫 NIEMALS committen** ohne expliziten Befehl
- **🚫 NIEMALS mergen** — nur Cherry-Pick verwenden
- Der Nutzer hat Recht: Wir hatten alles durcheinander gebracht
- Dieses Protokoll soll verhindern, dass wir den Kontext erneut verlieren
