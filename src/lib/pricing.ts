export function formatPriceChf(chf: number): string {
	return new Intl.NumberFormat('de-CH', {
		style: 'currency',
		currency: 'CHF',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(chf);
}
