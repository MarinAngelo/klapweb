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
	return `rgba(${r},${g},${b},${alpha})`;
}
