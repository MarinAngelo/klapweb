/**
 * Pricing table for checkout (Variante A: Stripe Payment Links).
 * - stripeUrl: Create a Stripe Payment Link in the dashboard and paste the URL here.
 * - priceChf: Display price in CHF (decimal, e.g. 1290.00). Must match the Stripe link.
 * - acceptedPayments: Shown informationally on the summary page.
 */
export interface PricingEntry {
	label: string;
	priceChf: number;
	stripeUrl: string;
	acceptedPayments: string[];
}

export const pricing: Record<string, PricingEntry> = {
	MeineWebsite: {
		label: 'Meine Website',
		priceChf: 1290.0,
		stripeUrl: 'https://buy.stripe.com/PLACEHOLDER_MEINE_WEBSITE',
		acceptedPayments: ['Kreditkarte', 'TWINT']
	}
	// Weitere Dienstleistungen hier eintragen:
	// ProfiWebsite: {
	// 	label: 'Profi Website',
	// 	priceChf: 2490.0,
	// 	stripeUrl: 'https://buy.stripe.com/PLACEHOLDER_PROFI_WEBSITE',
	// 	acceptedPayments: ['Kreditkarte', 'TWINT']
	// },
};

export function formatPriceChf(chf: number): string {
	return new Intl.NumberFormat('de-CH', {
		style: 'currency',
		currency: 'CHF',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(chf);
}
