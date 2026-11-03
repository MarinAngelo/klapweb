/**
 * Self-hosted fonts: Google fonts are downloaded at build time by scripts/self-host-fonts.js
 * into static/fonts/ (one CSS file per family + woff2 files). Visitors never contact Google.
 *
 * Plain JS: shared by the script (Node) and the app.
 */

/** Preset fonts (theme / Titelbereich / P5 / KlapStudio): family → Google axis spec */
export const PRESET_FONTS = {
	Inter: 'wght@300..700',
	Roboto: 'wght@300;400;700',
	'Open Sans': 'wght@300..700',
	Montserrat: 'wght@300..700',
	Poppins: 'wght@300;400;600;700',
	Lato: 'wght@300;400;700',
	Raleway: 'wght@300..700',
	Oswald: 'wght@300..700',
	Nunito: 'wght@300..700',
	'DM Sans': 'wght@300..700',
	Outfit: 'wght@300..700',
	'Plus Jakarta Sans': 'wght@300..700',
	'Josefin Sans': 'wght@300..700',
	Quicksand: 'wght@300..700',
	Cabin: 'wght@400;700',
	'Playfair Display': 'wght@400;700',
	Merriweather: 'wght@300;400;700',
	Lora: 'wght@400;700',
	'Cormorant Garamond': 'wght@300;400;700',
	'Crimson Pro': 'wght@300..700',
	'Nunito Sans': 'wght@300..700'
};

/** "Open Sans" → "open-sans" */
export const fontSlug = (/** @type {string} */ name) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

/** URL of the self-hosted CSS of a family */
export const localFontCss = (/** @type {string} */ name) => `/fonts/${fontSlug(name)}.css`;
