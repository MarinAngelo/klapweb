/**
 * "Angemeldet bleiben" — shared by all logins (admin, customer account, protected pages,
 * agency editor, task list). Ticked: the session lasts REMEMBER_DAYS; otherwise the
 * login's own short default applies.
 */
export const REMEMBER_DAYS = 14;
export const REMEMBER_SECONDS = REMEMBER_DAYS * 24 * 60 * 60;

/** Name of the checkbox in login forms (RememberMe.svelte) */
export const REMEMBER_FIELD = 'remember';

/** True if the login form was submitted with "Angemeldet bleiben" ticked */
export const wantsRemember = (form: FormData): boolean => form.get(REMEMBER_FIELD) === 'on';
