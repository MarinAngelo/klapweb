function parseHexRgb(hex: string): [number, number, number] | null {
	const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex ?? '');
	return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

/** WCAG-Luminanz eines Hex-Farbwerts (0 = schwarz, 1 = weiss) */
export function hexLuminance(hex: string): number {
	const rgb = parseHexRgb(hex);
	if (!rgb) return 0.5;
	return rgb
		.map((v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		})
		.reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/**
 * Hebt oder senkt die Helligkeit einer Hex-Farbe.
 * amount > 0 = heller, amount < 0 = dunkler (z.B. -50)
 */
export function shadeColor(hex: string, amount: number): string {
	const rgb = parseHexRgb(hex);
	if (!rgb) return hex;
	return (
		'#' +
		rgb
			.map((v) =>
				Math.max(0, Math.min(255, v + amount))
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}

export function hexToRgba(hex: string, alpha: number): string {
	let hexValue = hex.replace('#', '');
	if (hexValue.length === 3) {
		hexValue = hexValue
			.split('')
			.map((x) => x + x)
			.join('');
	}
	const num = parseInt(hexValue, 16);
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;

	// Wenn alpha > 1 ist, ist es wahrscheinlich ein Prozent-Wert
	const normalizedAlpha = alpha > 1 ? alpha / 100 : alpha;

	return `rgba(${r},${g},${b},${normalizedAlpha})`;
}

/** Mixes two hex colors; `share` = portion of `b` (0..1) */
export function mixHex(a: string, b: string, share: number): string {
	const ra = parseHexRgb(a);
	const rb = parseHexRgb(b);
	if (!ra || !rb) return a;
	return (
		'#' +
		ra
			.map((v, i) =>
				Math.round(v + (rb[i] - v) * share)
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	);
}

/** WCAG contrast ratio (1..21) */
export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [hexLuminance(a), hexLuminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text color readable on `bg` (WCAG AA 4.5:1 by default): keeps `fg` if it is sufficient,
 * otherwise shifts it towards black (light background) or white (dark background).
 */
export function readableColor(fg: string, bg: string, min = 4.5): string {
	if (!parseHexRgb(fg) || !parseHexRgb(bg)) return fg;
	if (contrastRatio(fg, bg) >= min) return fg;
	// Below ~0.18 luminance white gives the better contrast, above it black
	const target = hexLuminance(bg) > 0.18 ? '#000000' : '#ffffff';
	for (let share = 0.1; share < 1; share += 0.1) {
		const candidate = mixHex(fg, target, share);
		if (contrastRatio(candidate, bg) >= min) return candidate;
	}
	return target;
}
