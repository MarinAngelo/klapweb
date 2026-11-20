/**
 * Swiss QR bill (QR-Rechnung): payload, references and validation — Swiss Implementation
 * Guidelines for the QR-bill, version 2.3 (structured addresses only, no type «K»).
 * Plain JS: used by the invoice PDF (src/lib/server/invoicing) and by the content check
 * (scripts/check-translations.js, /admin/inhalte).
 */

/** @typedef {{ name: string; street?: string; buildingNumber?: string; postalCode: string; city: string; country: string }} QrAddress */

const compact = (/** @type {string} */ value) => (value ?? '').replace(/\s+/g, '').toUpperCase();

/** Letters → numbers (A=10 … Z=35) and mod 97, for IBAN and creditor reference (ISO 13616 / 11649) */
function mod97(/** @type {string} */ value) {
	const digits = value.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
	let rest = 0;
	for (const digit of digits) rest = (rest * 10 + Number(digit)) % 97;
	return rest;
}

/** Valid Swiss/Liechtenstein IBAN (only those are allowed on a QR bill) */
export function isValidQrIban(/** @type {string} */ iban) {
	const value = compact(iban);
	if (!/^(CH|LI)\d{2}[0-9A-Z]{17}$/.test(value)) return false;
	return mod97(value.slice(4) + value.slice(0, 4)) === 1;
}

/** QR-IBAN (IID 30000–31999): requires a QR reference instead of a creditor reference */
export function isQrIban(/** @type {string} */ iban) {
	const iid = Number(compact(iban).slice(4, 9));
	return iid >= 30000 && iid <= 31999;
}

/** IBAN in groups of four: «CH44 3199 9123 0008 8901 2» */
export const formatIban = (/** @type {string} */ iban) =>
	compact(iban)
		.replace(/(.{4})/g, '$1 ')
		.trim();

/** Creditor reference (ISO 11649, «RF…») from an invoice number, e.g. INV-1730… → RF18INV1730… */
export function creditorReference(/** @type {string} */ invoiceNumber) {
	const body = compact(invoiceNumber)
		.replace(/[^0-9A-Z]/g, '')
		.slice(0, 21);
	const check = 98 - mod97(`${body}RF00`);
	return `RF${String(check).padStart(2, '0')}${body}`;
}

/** QR reference (27 digits, check digit modulo 10 recursive) from the digits of the invoice number */
export function qrReference(/** @type {string} */ invoiceNumber) {
	const body = (invoiceNumber.replace(/\D/g, '') || '0').slice(-26).padStart(26, '0');
	const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
	let carry = 0;
	for (const digit of body) carry = table[(carry + Number(digit)) % 10];
	return body + String((10 - carry) % 10);
}

/** «RF18 INV1 730…» / «21 00000 00003 13947 14300 09017» for display */
export function formatReference(/** @type {string} */ reference) {
	if (reference.startsWith('RF')) return reference.replace(/(.{4})/g, '$1 ').trim();
	return `${reference.slice(0, 2)} ${reference.slice(2).replace(/(.{5})/g, '$1 ')}`.trim();
}

/**
 * Structured address from free text lines (e.g. the rich text «Verantwortliche Adresse»):
 * a line «8000 Zürich» (optionally «CH-8000 Zürich»), the line before it = street + number.
 * @param {string} name
 * @param {string[]} lines
 * @returns {QrAddress | null}
 */
export function parseAddress(name, lines) {
	// Paragraphs or soft line breaks (Shift+Enter in Prismic) — both count as lines
	const clean = lines
		.flatMap((line) => (line ?? '').split('\n'))
		.map((line) => line.trim())
		.filter(Boolean);
	const cityIndex = clean.findIndex((line) => /^(?:(CH|LI)[-\s])?(\d{4})\s+\S/.test(line));
	if (!name?.trim() || cityIndex < 0) return null;
	const cityMatch = /^(?:(CH|LI)[-\s])?(\d{4})\s+(.+)$/.exec(clean[cityIndex]);
	if (!cityMatch) return null;
	// Street line directly before the city; skip a line equal to the name
	const streetLine = clean
		.slice(0, cityIndex)
		.reverse()
		.find((line) => line !== name.trim());
	const streetMatch = streetLine ? /^(.*?\D)\s*(\d+\s?[a-zA-Z]?)$/.exec(streetLine) : null;
	return {
		name: name.trim(),
		street: streetMatch ? streetMatch[1].trim() : (streetLine ?? ''),
		buildingNumber: streetMatch ? streetMatch[2].replace(/\s/g, '') : '',
		postalCode: cityMatch[2],
		city: cityMatch[3].trim(),
		country: cityMatch[1] ?? 'CH'
	};
}

/** Countries written out on invoices → ISO code for the QR payload */
const COUNTRY_CODES = /** @type {Record<string, string>} */ ({
	schweiz: 'CH',
	suisse: 'CH',
	svizzera: 'CH',
	switzerland: 'CH',
	liechtenstein: 'LI',
	deutschland: 'DE',
	germany: 'DE',
	österreich: 'AT',
	austria: 'AT',
	frankreich: 'FR',
	france: 'FR',
	italien: 'IT',
	italy: 'IT'
});

/** Country name or code → ISO 3166 alpha-2 ('' = unknown) */
export function countryCode(/** @type {string | undefined} */ country) {
	const value = (country ?? '').trim();
	if (!value) return 'CH';
	if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
	return COUNTRY_CODES[value.toLowerCase()] ?? '';
}

const truncate = (/** @type {string | undefined} */ value, /** @type {number} */ max) =>
	(value ?? '')
		.replace(/[\r\n]+/g, ' ')
		.trim()
		.slice(0, max);

/** 7 lines of a structured address («S»), empty when no address */
function addressLines(/** @type {QrAddress | null | undefined} */ address) {
	if (!address) return ['', '', '', '', '', '', ''];
	return [
		'S',
		truncate(address.name, 70),
		truncate(address.street, 70),
		truncate(address.buildingNumber, 16),
		truncate(address.postalCode, 16),
		truncate(address.city, 35),
		address.country
	];
}

/**
 * Text encoded in the QR code (Swiss Payments Code).
 * @param {{ iban: string; creditor: QrAddress; amount: number | null; currency: 'CHF' | 'EUR'; debtor?: QrAddress | null; reference: string; message?: string }} bill
 */
export function qrPayload(bill) {
	const referenceType = bill.reference.startsWith('RF') ? 'SCOR' : bill.reference ? 'QRR' : 'NON';
	return [
		'SPC',
		'0200',
		'1',
		compact(bill.iban),
		...addressLines(bill.creditor),
		// Ultimate creditor: reserved, always empty
		'',
		'',
		'',
		'',
		'',
		'',
		'',
		bill.amount !== null && bill.amount > 0 ? bill.amount.toFixed(2) : '',
		bill.currency,
		...addressLines(bill.debtor),
		referenceType,
		bill.reference,
		truncate(bill.message, 140),
		'EPD'
	].join('\n');
}

/**
 * Why no QR bill can be printed ([] = ready): IBAN + address of the invoice issuer.
 * Keys are i18n keys (translations.ts).
 * @param {{ iban?: string; creditor: QrAddress | null; currency?: string }} settings
 * @returns {string[]}
 */
export function qrBillProblems(settings) {
	const problems = [];
	if (!settings.iban?.trim()) problems.push('IBAN fehlt');
	else if (!isValidQrIban(settings.iban))
		problems.push('IBAN ist keine gültige Schweizer oder Liechtensteiner IBAN');
	if (!settings.creditor)
		problems.push(
			'Adresse für die QR-Rechnung unvollständig (Strasse Nr. und «PLZ Ort» je auf eigener Zeile)'
		);
	if (settings.currency && !['CHF', 'EUR'].includes(settings.currency))
		problems.push('QR-Rechnung nur in CHF oder EUR möglich');
	return problems;
}
