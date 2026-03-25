/**
 * Customer storage via Netlify Blobs.
 *
 * Each purchase creates one blob (key = `${Date.now()}_${uuid}`).
 * Never store all customers in a single blob — race conditions on concurrent writes.
 *
 * Required Netlify environment variables:
 *   NETLIFY_SITE_ID  — Site Settings → General → Site ID
 *   NETLIFY_TOKEN    — User Settings → Applications → Personal access tokens (expiry: never)
 *
 * NOTE: @netlify/blobs auto-detection does NOT work with adapter-auto on Netlify.
 * siteID + token must always be passed explicitly via $env/dynamic/private.
 *
 * Admin view: /admin/kunden?secret=<ADMIN_SECRET>
 *
 * Called from:
 *   - src/routes/api/invoice/+server.ts      (Rechnung, fire-and-forget after email)
 *   - src/routes/api/save-customer/+server.ts (Bar, called from zusammenfassung page)
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';

export interface CustomerRecord {
	id: string;
	date: string;
	paymentMethod: 'rechnung' | 'bar' | 'stripe';
	service: string;
	amount: number | null;
	currency: string;
	discountCode?: string;
	// Billing address / contact
	vorname?: string;
	nachname?: string;
	firma?: string;
	email?: string;
	adresse?: string;
	plz?: string;
	ort?: string;
	land?: string;
	// Extra form fields (key → value)
	extra?: Record<string, string>;
}

function getCustomerStore() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name: 'kunden', siteID, token });
}

export async function saveCustomer(record: Omit<CustomerRecord, 'id'>): Promise<string> {
	const store = getCustomerStore();
	const id = `${Date.now()}_${crypto.randomUUID()}`;
	await store.setJSON(id, { id, ...record });
	return id;
}

export async function deleteCustomer(id: string): Promise<void> {
	const store = getCustomerStore();
	await store.delete(id);
}

export async function listCustomers(): Promise<CustomerRecord[]> {
	const store = getCustomerStore();
	const { blobs } = await store.list();
	const records = await Promise.all(
		blobs.map((b) => store.get(b.key, { type: 'json' }) as Promise<CustomerRecord>)
	);
	return records
		.filter(Boolean)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
