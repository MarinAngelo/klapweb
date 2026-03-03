export function calcDisplayPrice(
	basePrice: number | null,
	discountPct: number | null,
	depositPct: number | null
): number | null {
	if (basePrice == null) return null;
	const afterDiscount = discountPct != null ? basePrice * (1 - discountPct / 100) : basePrice;
	if (depositPct != null) return Math.round((afterDiscount * depositPct) / 100 * 100) / 100;
	if (discountPct != null) return Math.round(afterDiscount * 100) / 100;
	return basePrice;
}

export function formatPriceChf(chf: number): string {
	return new Intl.NumberFormat('de-CH', {
		style: 'currency',
		currency: 'CHF',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(chf);
}
