/**
 * Simple bookkeeping (feature `buchhaltung`, /admin/buchhaltung): income and expenses only.
 *
 * - Manual entries (income or expense): store `buchhaltung`, one blob per entry; optional receipt
 *   (PDF/image) in store `buchhaltung_belege` (key = entry id).
 * - Paid invoices are income automatically: derived on every call from `manuelle_rechnungen`
 *   (paymentStatus 'bezahlt'), date = paidAt (older invoices: invoice date). Never copied, so the
 *   books follow every status change.
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import { listManualInvoices, type ManualInvoiceRecord } from '$lib/server/invoices';
import { invoiceTotals, loadInvoiceSettings } from '$lib/server/invoicing';

export type BuchungTyp = 'einnahme' | 'ausgabe';

export const KATEGORIEN: Record<BuchungTyp, string[]> = {
	einnahme: ['Verkauf', 'Dienstleistung', 'Zinsen', 'Diverses'],
	ausgabe: [
		'Material',
		'Miete',
		'Software',
		'Werbung',
		'Reise',
		'Versicherung',
		'Gebühren',
		'Diverses'
	]
};
export const RECHNUNG_KATEGORIE = 'Rechnungen';

export interface Buchung {
	id: string;
	typ: BuchungTyp;
	/** YYYY-MM-DD */
	datum: string;
	text: string;
	/** Amount in CHF incl. VAT, always positive */
	betrag: number;
	kategorie: string;
	beleg?: { name: string; contentType: string; size: number };
	createdAt: string;
	/** Derived from a paid invoice (not stored, not deletable here) */
	rechnungId?: string;
}

export const BELEG_MAX_BYTES = 10 * 1024 * 1024;
export const BELEG_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic'
];

function store(name: 'buchhaltung' | 'buchhaltung_belege') {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) {
		throw new Error(
			`Netlify Blobs: NETLIFY_SITE_ID=${siteID ? 'gesetzt' : 'fehlt'}, NETLIFY_TOKEN=${token ? 'gesetzt' : 'fehlt'}`
		);
	}
	return getStore({ name, siteID, token, consistency: 'strong' });
}

const ID_RE = /^\d{13}_[0-9a-f-]{36}$/;
export const isValidBuchungId = (id: unknown): id is string =>
	typeof id === 'string' && ID_RE.test(id);

/** Swiss calendar day of an ISO time */
const swissDay = (iso: string) =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date(iso));

export async function listManualEntries(): Promise<Buchung[]> {
	const s = store('buchhaltung');
	const { blobs } = await s.list();
	const entries = await Promise.all(
		blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<Buchung>)
	);
	return entries.filter(Boolean);
}

/** Paid invoices as income entries */
export async function invoiceIncome(): Promise<Buchung[]> {
	const invoices = (await listManualInvoices()).filter((inv) => inv.paymentStatus === 'bezahlt');
	if (!invoices.length) return [];
	const needsVat = invoices.some((inv) => typeof inv.total !== 'number');
	const vatRate = needsVat ? (await loadInvoiceSettings()).vatRate : null;
	return invoices.map((inv: ManualInvoiceRecord) => ({
		id: `rechnung:${inv.id}`,
		rechnungId: inv.id,
		typ: 'einnahme' as const,
		datum: swissDay(inv.paidAt ?? inv.date),
		text: `${inv.invoiceNumber} – ${[inv.vorname, inv.nachname].filter(Boolean).join(' ') || inv.firma || ''}`,
		betrag:
			typeof inv.total === 'number' ? inv.total : invoiceTotals(inv.items ?? [], vatRate).total,
		kategorie: RECHNUNG_KATEGORIE,
		createdAt: inv.paidAt ?? inv.date
	}));
}

/** All bookings (manual + paid invoices), newest first */
export async function listBuchungen(): Promise<Buchung[]> {
	const [manual, income] = await Promise.all([listManualEntries(), invoiceIncome()]);
	return [...manual, ...income].sort(
		(a, b) => b.datum.localeCompare(a.datum) || b.createdAt.localeCompare(a.createdAt)
	);
}

/** Validates the form; returns the entry data or an error message */
export function parseBuchung(
	form: FormData
): Omit<Buchung, 'id' | 'createdAt' | 'beleg'> | { error: string } {
	const typ = form.get('typ');
	if (typ !== 'einnahme' && typ !== 'ausgabe')
		return { error: 'Bitte Einnahme oder Ausgabe wählen' };
	const datum = String(form.get('datum') ?? '');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || Number.isNaN(Date.parse(datum))) {
		return { error: 'Ungültiges Datum' };
	}
	const text = String(form.get('text') ?? '')
		.trim()
		.slice(0, 300);
	if (!text) return { error: 'Bitte einen Text eingeben' };
	const betrag = Math.round(Number(String(form.get('betrag') ?? '').replace(',', '.')) * 100) / 100;
	if (!Number.isFinite(betrag) || betrag <= 0)
		return { error: 'Bitte einen Betrag grösser als 0 eingeben' };
	const kategorie = String(form.get('kategorie') ?? '');
	if (!KATEGORIEN[typ].includes(kategorie)) return { error: 'Bitte eine Kategorie wählen' };
	return { typ, datum, text, betrag, kategorie };
}

export async function createBuchung(
	data: Omit<Buchung, 'id' | 'createdAt' | 'beleg'>,
	beleg?: File | null
): Promise<Buchung> {
	const id = `${Date.now()}_${randomUUID()}`;
	const entry: Buchung = { ...data, id, createdAt: new Date().toISOString() };
	if (beleg && beleg.size > 0) {
		await store('buchhaltung_belege').set(id, await beleg.arrayBuffer(), {
			metadata: { contentType: beleg.type, name: beleg.name }
		});
		entry.beleg = { name: beleg.name, contentType: beleg.type, size: beleg.size };
	}
	await store('buchhaltung').setJSON(id, entry);
	return entry;
}

/** Changes a manual entry; a new receipt replaces the old one, removeBeleg deletes it */
export async function updateBuchung(
	id: string,
	data: Omit<Buchung, 'id' | 'createdAt' | 'beleg'>,
	beleg?: File | null,
	removeBeleg = false
): Promise<Buchung | null> {
	const existing = (await store('buchhaltung').get(id, { type: 'json' })) as Buchung | null;
	if (!existing) return null;
	const entry: Buchung = { ...existing, ...data, id, createdAt: existing.createdAt };
	if (beleg && beleg.size > 0) {
		await store('buchhaltung_belege').set(id, await beleg.arrayBuffer(), {
			metadata: { contentType: beleg.type, name: beleg.name }
		});
		entry.beleg = { name: beleg.name, contentType: beleg.type, size: beleg.size };
	} else if (removeBeleg) {
		await store('buchhaltung_belege').delete(id);
		delete entry.beleg;
	}
	await store('buchhaltung').setJSON(id, entry);
	return entry;
}

export async function deleteBuchung(id: string): Promise<void> {
	await Promise.all([store('buchhaltung').delete(id), store('buchhaltung_belege').delete(id)]);
}

export async function getBeleg(
	id: string
): Promise<{ data: ArrayBuffer; contentType: string; name: string } | null> {
	const result = await store('buchhaltung_belege').getWithMetadata(id, { type: 'arrayBuffer' });
	if (!result) return null;
	const meta = result.metadata as { contentType?: string; name?: string };
	return {
		data: result.data,
		contentType: meta.contentType || 'application/octet-stream',
		name: meta.name || 'beleg'
	};
}

/** Error message for an invalid receipt file, null when fine or empty */
export function belegError(file: File | null): string | null {
	if (!file || file.size === 0) return null;
	if (file.size > BELEG_MAX_BYTES) return 'Der Beleg ist grösser als 10 MB';
	if (!BELEG_TYPES.includes(file.type)) return 'Beleg nur als PDF oder Bild (JPG, PNG, WebP, HEIC)';
	return null;
}
