/**
 * Manual invoice storage via Netlify Blobs.
 *
 * Each manual invoice creates one blob (key = `${Date.now()}_${uuid}`).
 * Never store all invoices in a single blob — race conditions on concurrent writes.
 *
 * Required Netlify environment variables:
 *   NETLIFY_SITE_ID  — Site Settings → General → Site ID
 *   NETLIFY_TOKEN    — User Settings → Applications → Personal access tokens (expiry: never)
 *
 * Admin view: /admin/rechnungen?secret=<ADMIN_SECRET>
 *
 * Called from:
 *   - src/routes/admin/rechnungen/+page.server.ts (Create, Preview, Email)
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export interface InvoiceLineItem {
	description: string;
	quantity: number;
	unitPrice: number;
}

export interface ManualInvoiceRecord {
	id: string;
	invoiceNumber: string;
	date: string;
	status: 'gespeichert' | 'gesendet';
	paymentStatus: 'offen' | 'bezahlt';
	paymentMethod?: 'rechnung' | 'bar';
	// Billing address / contact
	vorname: string;
	nachname: string;
	firma?: string;
	email?: string;
	adresse?: string;
	plz?: string;
	ort?: string;
	land?: string;
	// Line items
	items: InvoiceLineItem[];
	// Optional notes
	notes?: string;
	// Delivery metadata
	emailSentAt?: string;
	currency?: string;
}

function getInvoiceStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'manuelle_rechnungen', siteID, token });
}

export async function saveManualInvoice(record: Omit<ManualInvoiceRecord, 'id'>): Promise<string> {
	const store = getInvoiceStore();
	const id = `${Date.now()}_${crypto.randomUUID()}`;
	await store.setJSON(id, { id, ...record });
	return id;
}

export async function deleteManualInvoice(id: string): Promise<void> {
	const store = getInvoiceStore();
	await store.delete(id);
}

export async function listManualInvoices(): Promise<ManualInvoiceRecord[]> {
	const store = getInvoiceStore();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<ManualInvoiceRecord>)
	);
	return records
		.filter(Boolean)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getManualInvoice(id: string): Promise<ManualInvoiceRecord | null> {
	const store = getInvoiceStore();
	return (await store.get(id, { type: 'json' })) as ManualInvoiceRecord | null;
}

export async function updateManualInvoice(
	id: string,
	record: Partial<Omit<ManualInvoiceRecord, 'id'>>
): Promise<void> {
	const store = getInvoiceStore();
	const existing = await getManualInvoice(id);
	if (!existing) throw new Error('Rechnung nicht gefunden');
	await store.setJSON(id, { ...existing, ...record });
}
