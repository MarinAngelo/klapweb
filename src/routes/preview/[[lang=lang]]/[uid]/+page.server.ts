// Prismic-Vorschau einer Seite: /api/preview leitet auf /preview/… weiter.
// Gleicher Loader wie /[[lang]]/[uid], aber nie vorgerendert → das Vorschau-Cookie wird gelesen.
export { load } from '../../../[[lang=lang]]/[uid]/+page.server';
export const prerender = false;
