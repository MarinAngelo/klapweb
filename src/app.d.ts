// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			themeColorsCss?: string;
			/** Page language (Prismic locale, e.g. de-ch) → <html lang> in hooks.server.ts */
			htmlLang?: string;
			user?: {
				id: string;
				email: string;
				name: string;
				verified: boolean;
			};
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
