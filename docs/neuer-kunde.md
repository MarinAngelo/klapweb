# Neuer Kunde: Branch mit neuem Prismic-Repository verbinden

Schritt für Schritt vom leeren Prismic-Repository bis zur laufenden Netlify-Site.
Grundregeln zu Branches: `docs/git-strategie.md`.

## 1. Prismic-Repository anlegen

1. Auf [prismic.io/dashboard](https://prismic.io/dashboard) ein neues Repository anlegen.
   Name = späterer `repositoryName` (z.B. `muster-gmbh` → `muster-gmbh.prismic.io`).
2. Hauptsprache **German - Switzerland (de-ch)** wählen.
3. Den Einrichtungs-Assistenten («Set up your project», «Copy setup prompt», «Waiting for your
   project to connect…») **nicht** verwenden. Er ist für neue Projekte gedacht und wartet auf die
   neue Prismic-CLI. Unser Projekt verbindet sich über Slice Machine (Schritt 3). Assistent
   schliessen bzw. direkt `https://<repo>.prismic.io` öffnen.

## 2. Branch anlegen

```sh
git checkout main
git pull
git checkout -b <kunde> main
```

In `slicemachine.config.json` (branch-eigen, kommt nie nach `main`):

```json
"repositoryName": "<repo>",
"plan": "basis"
```

- `plan`: `basis`, `professional` oder `individuell` (`gating.json` › `plans`)
- Zusatz-Features oder Abschaltungen: `"features": [...]`, `"featuresDisabled": [...]`
  (am einfachsten über `/agency/gating` im lokalen Dev-Server)
- Prüfen, dass der Merge-Schutz eingerichtet ist: `git config --get merge.ours.driver` → `true`

Modelle für diesen Plan erzeugen:

```sh
node scripts/build-customtypes.js
```

## 3. Modelle nach Prismic übertragen

1. `.env` Block 2 (branch-spezifisch) auf den neuen Kunden anpassen, siehe `.env.example`.
   `PRISMIC_WRITE_TOKEN`: Prismic › Settings › API & Security › Write APIs.
2. `npm run dev` startet Website (http://localhost:5173) und Slice Machine
   (http://localhost:9999).
3. In Slice Machine mit dem Prismic-Konto anmelden, das Zugriff auf das neue Repository hat.
4. **Push** klicken. Alle Inhalts-Typen und Inhalts-Elemente des Plans landen im Repository.

Die Website zeigt bis Schritt 4 einen Fehler («Kritisches Dokument fehlt …»). Das ist normal.

## 4. Pflicht-Dokumente in Prismic anlegen

In dieser Reihenfolge, jeweils veröffentlichen:

| Inhalts-Typ    | Mindestens                                                    |
| -------------- | ------------------------------------------------------------- |
| Einstellungen  | «Website Titel», «Website Domain», «Absender-E-Mail»          |
| Design Vorlage | Farben, Schrift, **«Aktiv» = Ja** (genau eine aktive Vorlage) |
| Navigation     | mindestens ein Link                                           |
| Page           | Startseite mit UID **`home`**                                 |

Impressum, Datenschutz und AGB kommen aus dem Code (`[legal=legal]`), die Angaben dazu aus den
Einstellungen.

Solange die Website im Aufbau ist: Einstellungen › «Startseite umleiten» = Ja
(Vorschau der Startseite zeigt trotzdem die echte Startseite) und SEO › «Ganze Website nicht
indexieren» = Ja.

Danach lokal prüfen: `npm run dev` → http://localhost:5173 lädt ohne Fehler.

## 5. Committen

Nur auf dem Kunden-Branch, nicht nach `main`:

```sh
git add slicemachine.config.json
git commit -m "<Kunde>: Prismic-Repository und Plan"
git push -u origin <kunde>
```

## 6. Netlify-Site anlegen

1. Netlify › Add new site › Import from Git › Repository `klapweb`, **Branch `<kunde>`**.
   Build-Einstellungen kommen aus `package.json` / `netlify.toml` (Build `npm run build`).
2. Site settings › Environment variables (Block 2 aus `.env.example`, Werte des Kunden):
   - `NETLIFY_SITE_ID` (Site settings › General › Site ID), `NETLIFY_TOKEN`
   - `ADMIN_SECRET` (Admin-Login `/admin`)
   - `RESEND_API_KEY` (E-Mails), Absender-Domain in Resend verifizieren
   - je nach Plan/Features weitere: `ANTHROPIC_API_KEY` (Chat-Bot), `PRISMIC_WRITE_TOKEN`,
     `DOOR_CODE` … (`gating.json` › `features.<id>.env`)
3. Deploy auslösen und die Netlify-URL öffnen.

## 7. Prismic mit der Website verbinden

1. **Vorschau:** Prismic › Settings › Previews › Create a preview
   - Domain: Netlify-URL bzw. Kunden-Domain (`https://…`)
   - Link Resolver / Preview route: **`/api/preview`**
2. **Neu bauen beim Veröffentlichen:** Netlify › Site settings › Build & deploy › Build hooks ›
   Hook anlegen (Branch `<kunde>`), URL kopieren → Prismic › Settings › Webhooks › neuer Webhook
   mit dieser URL, Auslöser «A document is published / unpublished».
   Ohne Webhook erscheinen veröffentlichte Inhalte erst nach dem nächsten Deploy (Seiten sind
   vorgerendert).
3. **Live-Ansicht im Page Builder** (Inhalts-Elemente werden beim Bearbeiten live angezeigt):
   beliebiges Dokument öffnen › oben rechts **⋮ › «Live preview settings»** › URL
   **`https://<domain>/slice-simulator`** (z.B. `https://klap-web.ch/slice-simulator`) › Save.
   - Route `src/routes/slice-simulator` ist im Kern vorhanden, nichts einzurichten
   - Tippfehler in der Domain (z.B. `klap-web-ch` statt `klap-web.ch`) → jedes Element zeigt «Error»
   - Neue Felder/Varianten erscheinen erst nach dem Deploy des Codes; vorher «Error» bei
     betroffenen Elementen

## 8. Domain und Start

1. Netlify › Domain management › Kunden-Domain hinzufügen, DNS beim Anbieter setzen.
2. Prismic › Einstellungen › «Website Domain» auf die Kunden-Domain setzen (Sitemap, robots.txt).
3. Vorschau-Domain (Schritt 7.1) und Live-Ansicht-URL (Schritt 7.3) in Prismic auf die
   Kunden-Domain ändern.
4. Zum Start: «Startseite umleiten» = Nein und «Ganze Website nicht indexieren» = Nein
   (in allen Sprachen der Einstellungen), veröffentlichen.

## Danach: Kern-Änderungen übernehmen

Neue Kern-Änderungen kommen per `git merge main` (Skill `/kunden-merge`). Neue oder geänderte
Modelle danach jeweils mit **Push** in Slice Machine übertragen.
