// Prismic-Vorschau der Startseite: /api/preview leitet auf /preview/… weiter.
// Gleicher Loader wie /[[lang]], aber nie vorgerendert → das Vorschau-Cookie wird gelesen.
export { load } from '../../[[lang=lang]]/+page.server';
export const prerender = false;
