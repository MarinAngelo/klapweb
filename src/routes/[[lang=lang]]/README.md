Prismic-Vorschau: `/api/preview` leitet auf `/preview/<url>` weiter. Die Routen in `src/routes/preview/[[lang=lang]]/` übernehmen Loader und Komponente der Seiten hier, werden aber nie vorgerendert (das Vorschau-Cookie wird gelesen). Kein `[[preview=preview]]/[[lang=lang]]`: zwei optionale Parameter hintereinander löst SvelteKit nicht zuverlässig auf (`/en-us/seite` → 404).

Die Slice-Vorschau (Mock-Daten) liegt separat unter `/slice-preview/[slice]/[variation]`.

All routes within this directory will be served using the following URLs:

- `/example-route` (prerendered)
- `/preview/example-route` (server-rendered)

See <https://prismic.io/docs/svelte-preview> for more information.

Bugs:

- --page-font: 'Roboto', sans-serif; /_ Fallback greift nicht, Problem in app.html stattdessen wird system font verwendet _/
- Header Opacity: Slices, die den Header überlappen können, sollen die Möglichkeit haben die Header-Opacity zu überschreiben
