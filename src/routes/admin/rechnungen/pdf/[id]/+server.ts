import { error } from '@sveltejs/kit';
import { getManualInvoice } from '$lib/server/invoices';
import { documentFromRecord, loadInvoiceSettings, renderInvoicePdf } from '$lib/server/invoicing';

export const prerender = false;

/** PDF of a stored invoice, opens in a browser tab (like receipts in «Buchhaltung»). Admin session via hooks. */
export async function GET({ params, fetch }) {
	const record = await getManualInvoice(params.id).catch(() => null);
	if (!record) throw error(404, 'Rechnung nicht gefunden');
	const settings = await loadInvoiceSettings(fetch);
	const pdf = await renderInvoicePdf(documentFromRecord(record), settings);
	return new Response(Buffer.from(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="${encodeURIComponent(record.invoiceNumber)}.pdf"`,
			'Cache-Control': 'private, no-store'
		}
	});
}
