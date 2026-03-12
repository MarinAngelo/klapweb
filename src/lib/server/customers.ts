import { getStore } from '@netlify/blobs';

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
	return getStore('kunden');
}

export async function saveCustomer(record: Omit<CustomerRecord, 'id'>): Promise<string> {
	const store = getCustomerStore();
	const id = `${Date.now()}_${crypto.randomUUID()}`;
	await store.setJSON(id, { id, ...record });
	return id;
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
