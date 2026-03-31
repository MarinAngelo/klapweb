import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const css = event.locals.themeColorsCss;
			if (!css) return html;
			// Inline-Style auf <html>: schlägt immer alle Stylesheets,
			// egal in welcher Reihenfolge Vite/Browser sie lädt.
			return html.replace('<html ', `<html style="${css}" `);
		}
	});
};
