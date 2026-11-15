import { PRESET_FONTS, localFontCss } from '$lib/fontSources.js';

/** Preset font names (theme, Titelbereich, P5Grafik, KlapStudio) */
export const presetFontNames = Object.keys(PRESET_FONTS);

/** Self-hosted CSS per preset font (downloaded at build time, see scripts/self-host-fonts.js) */
export const presetFontUrls: Record<string, string> = Object.fromEntries(
	presetFontNames.map((name) => [name, localFontCss(name)])
);
