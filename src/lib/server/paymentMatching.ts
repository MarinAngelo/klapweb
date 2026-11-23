/**
 * Payment reconciliation (Zahlungsabgleich, /admin/rechnungen): a bank export (CSV) is searched
 * row by row for unpaid invoices: payment reference (RF creditor reference or 27-digit QR
 * reference, spaces ignored) or the invoice number in any text (e.g. ZKB «Zahlungszweck»:
 * «Rechnung MAN-…»). If an amount in the same row equals the invoice total, the invoice is marked
 * as paid; paidAt = a date found in the row (else today). Amounts only from credit columns
 * («Gutschrift», «Credit», «Haben») when the header has one, so debits with the same text don't count.
 */
import { creditorReference, qrReference } from '$lib/qrBill.js';
import {
	listManualInvoices,
	updateManualInvoice,
	type ManualInvoiceRecord
} from '$lib/server/invoices';
import { invoiceTotals, loadInvoiceSettings } from '$lib/server/invoicing';

export type MatchStatus = 'bezahlt' | 'betrag' | 'schon-bezahlt' | 'unbekannt';

export interface MatchResult {
	reference: string;
	status: MatchStatus;
	invoiceNumber?: string;
	customer?: string;
	expected?: number;
	/** Amounts found in the row */
	amounts: number[];
	date?: string;
	row: number;
}

/** Splits CSV text into rows of cells (delimiter ; , or tab; quotes) */
export function parseCsv(text: string): string[][] {
	const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
	const delimiter = [';', '\t', ','].sort(
		(a, b) => firstLine.split(b).length - firstLine.split(a).length
	)[0];
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"' && text[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (c === '"') quoted = false;
			else cell += c;
		} else if (c === '"') quoted = true;
		else if (c === delimiter) {
			row.push(cell);
			cell = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
		} else cell += c;
	}
	if (cell || row.length) rows.push([...row, cell]);
	return rows.filter((r) => r.some((c) => c.trim()));
}

/** Amount in Swiss/European notation: 1'234.50 · 1234,50 · 1.234,50 · -120.00 → absolute value */
export function parseAmount(raw: string): number | null {
	let s = raw.replace(/[’'\s]|CHF|EUR/gi, '');
	if (!/^[+-]?\d[\d.,]*$/.test(s)) return null;
	s = s.replace(/^[+-]/, '');
	const lastComma = s.lastIndexOf(',');
	const lastDot = s.lastIndexOf('.');
	if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
	else s = s.replace(/,/g, '');
	const n = Number(s);
	return Number.isFinite(n) && /[.,]\d{1,2}$|^\d+$/.test(raw.trim().replace(/^[+-]/, ''))
		? n
		: null;
}

/** First date in a row (dd.mm.yyyy or yyyy-mm-dd) as YYYY-MM-DD */
function rowDate(cells: string[]): string | undefined {
	for (const c of cells) {
		const ch = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(c);
		if (ch) return `${ch[3]}-${ch[2].padStart(2, '0')}-${ch[1].padStart(2, '0')}`;
		const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(c);
		if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
	}
	return undefined;
}

const todaySwiss = () =>
	new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Zurich' }).format(new Date());

/** Reconciles a bank export; marks matching invoices as paid unless dryRun */
export async function reconcilePayments(csvText: string, dryRun = false): Promise<MatchResult[]> {
	const rows = parseCsv(csvText);
	const invoices = await listManualInvoices();
	const settings = await loadInvoiceSettings();
	const total = (inv: ManualInvoiceRecord) =>
		typeof inv.total === 'number'
			? inv.total
			: invoiceTotals(inv.items ?? [], settings.vatRate).total;

	// Reference → invoice (stored reference, for older invoices both possible references)
	const byRef = new Map<string, ManualInvoiceRecord>();
	for (const inv of invoices) {
		if (inv.paymentStatus === 'storniert') continue;
		const refs = inv.reference
			? [inv.reference]
			: [creditorReference(inv.invoiceNumber), qrReference(inv.invoiceNumber)];
		for (const ref of refs) byRef.set(ref.replace(/\s/g, '').toUpperCase(), inv);
		// Invoice number in the payment text (banks often drop the structured reference)
		byRef.set(inv.invoiceNumber.replace(/\s/g, '').toUpperCase(), inv);
	}

	// Credit columns of the header row (ZKB: «Gutschrift CHF»); otherwise every cell may hold the amount
	const header = rows[0] ?? [];
	const creditCols = header
		.map((h, i) => (/gutschrift|credit|haben|eingang/i.test(h) ? i : -1))
		.filter((i) => i >= 0);
	const amountCells = (cells: string[]) =>
		creditCols.length ? creditCols.map((i) => cells[i] ?? '') : cells;

	const results: MatchResult[] = [];
	const done = new Set<string>();
	const known = [...byRef.keys()];
	rows.forEach((cells, index) => {
		// Per cell without spaces: references are often printed in groups («RF18 INV1 795…»)
		const compactCells = cells.map((c) => c.replace(/\s/g, '').toUpperCase());
		const refs = new Set(known.filter((ref) => compactCells.some((c) => c.includes(ref))));
		// Unknown references: only cells that consist of a reference alone
		for (const c of compactCells) {
			if (/^(RF\d{2}[0-9A-Z]{1,21}|\d{27})$/.test(c) && !byRef.has(c)) refs.add(c);
		}
		if (!refs.size) return;
		const amounts = amountCells(cells)
			.map(parseAmount)
			.filter((n): n is number => n !== null && n > 0);
		const date = rowDate(cells);
		const seenInRow = new Set<string>();
		for (const reference of refs) {
			const inv = byRef.get(reference);
			if (inv) {
				if (seenInRow.has(inv.id)) continue;
				seenInRow.add(inv.id);
			}
			const base = { reference, amounts, date, row: index + 1 };
			if (!inv) {
				results.push({ ...base, status: 'unbekannt' });
				continue;
			}
			if (done.has(inv.id)) continue;
			const expected = total(inv);
			const customer = [inv.vorname, inv.nachname].filter(Boolean).join(' ') || inv.firma;
			const info = { ...base, invoiceNumber: inv.invoiceNumber, customer, expected };
			if (inv.paymentStatus === 'bezahlt') {
				results.push({ ...info, status: 'schon-bezahlt' });
				done.add(inv.id);
			} else if (amounts.some((a) => Math.abs(a - expected) < 0.005)) {
				results.push({ ...info, status: 'bezahlt' });
				done.add(inv.id);
			} else {
				results.push({ ...info, status: 'betrag' });
			}
		}
	});

	if (!dryRun) {
		for (const r of results.filter((x) => x.status === 'bezahlt')) {
			const inv = [...byRef.values()].find((i) => i.invoiceNumber === r.invoiceNumber)!;
			const day = r.date && r.date <= todaySwiss() ? r.date : todaySwiss();
			await updateManualInvoice(inv.id, {
				paymentStatus: 'bezahlt',
				paidAt: `${day}T12:00:00.000Z`
			});
		}
	}
	return results;
}
