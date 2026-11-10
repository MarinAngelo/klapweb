/**
 * Content check for editors: missing translations + link problems in Prismic.
 * Used by scripts/check-translations.js (terminal, dev/build) and /admin/inhalte (editors).
 *
 * Plain JS without SvelteKit aliases so Node scripts can import it.
 */

/** Custom types rendered as their own (static) pages — keep in sync with the routes */
import { isGoogleShortLink, parseMapPoint } from './mapPoint.js';
import { diagnoseAngebot, diagnoseArbeitstag } from './terminDiagnose.js';
import { parseAddress, qrBillProblems } from './qrBill.js';

export const TRANSLATED_TYPES = ['page', 'leistung', 'ressource'];

/**
 * Tokens filled in by the code (mails, invoices, appointments, events, page prices).
 * Variables from the Prismic document "Variablen" are added at runtime.
 * New token in the code → add it here, otherwise "Inhalte prüfen" reports it as unknown.
 */
export const CODE_TOKENS = [
	// Resource bookings (confirmation, reminders)
	'Name',
	'Ressource',
	'RessourceUid',
	'Anreise',
	'Abreise',
	'Nächte',
	'Personen',
	'Zimmer',
	'Total',
	'Buchungsreferenz',
	'Türcode',
	'Messenger-Apps',
	'WhatsApp',
	// Page prices / e-commerce
	'Preis',
	'Rabatt',
	'PreisRabatt',
	'Anzahlung',
	'AnzahlungBetrag',
	'Restbetrag',
	'Abrechnungsart',
	'Dienstleistung',
	// Invoices, customers, newsletter
	'Betrag',
	'Einmalig',
	'Monatlich',
	'Jährlich',
	'Email',
	'Firma',
	'Kundenname',
	'Vorname',
	'Nachname',
	'Rechnungsnummer',
	'Waehrung',
	'Zahlungsfrist',
	// Appointments / events
	'Titel',
	'Datum',
	'Uhrzeit',
	'Dauer',
	'Ort',
	'Event-Name',
	'Wegbeschreibung',
	'Ort-Telefon',
	'Ort-Karte',
	'Stornofrist'
];

const TOKEN = /\{\{([^{}]+)\}\}/g;

/** Token name comparable to variable names (see tokenKey in variables.js) */
const tokenName = (/** @type {string} */ name) =>
	name
		.trim()
		.replace(/^\{\{\s*/, '')
		.replace(/\s*\}\}$/, '')
		.normalize('NFC');

/** Edit distance for "did you mean" suggestions */
function distance(/** @type {string} */ a, /** @type {string} */ b) {
	const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			d[i][j] = Math.min(
				d[i - 1][j] + 1,
				d[i][j - 1] + 1,
				d[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
			);
	return d[a.length][b.length];
}

/** Field of the working day a diagnosis (terminDiagnose.js) refers to */
const terminField = (/** @type {string} */ key) =>
	key.startsWith('Angebot') || key.includes('Buchbares Angebot')
		? 'Buchbare Angebote'
		: key.startsWith('Datum')
			? 'Datum'
			: key.includes('Startzeit') || key.includes('Endzeit')
				? 'Startzeit / Endzeit'
				: key.startsWith('Die Serie')
					? 'Wiederholung'
					: '';

/** «Kartenpunkt» fields (link or coordinates, see $lib/mapPoint.js) */
const MAP_POINT_FIELDS = ['map_url', 'location_map_url', 'geo_koordinaten', 'map_point'];

const ABSOLUTE_OR_SPECIAL = /^(https?:|mailto:|tel:|\/|#|\{\{)/i;

/**
 * @typedef {{ link_type?: string; url?: string; id?: string; type?: string; uid?: string; lang?: string }} LinkField
 * @typedef {{ id: string; type: string; uid: string | null; lang: string; title: string }} DocRef
 * @typedef {{ doc: DocRef; kind: 'relative' | 'untranslated_target' | 'unknown_token' | 'map_point' | 'mail_from' | 'mail_domain' | 'termin' | 'stunden_unprotected' | 'empty_slice' | 'legal_missing' | 'invoice_qr'; url?: string; problem?: import('./terminDiagnose.js').TerminProblem; target?: string; suggestion?: string; token?: string; field?: string }} LinkProblem
 */

/** @typedef {{ slice?: string; path: string[]; inText?: boolean }} FieldCtx */

/**
 * All values of a document with their location (slice type + field keys), for messages that
 * name the field: strings (text fields, rich text) and link objects (incl. rich text hyperlinks).
 * @param {any} node
 * @param {FieldCtx} [ctx]
 * @returns {Generator<{ value: any; ctx: FieldCtx }>}
 */
function* fieldValues(node, ctx = { path: [] }) {
	if (typeof node === 'string') {
		yield { value: node, ctx };
		return;
	}
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const item of node) yield* fieldValues(item, ctx);
		return;
	}
	if (typeof node.link_type === 'string') {
		yield { value: node, ctx };
		return;
	}
	// Slice: only its fields (primary, items), location restarts with the slice type
	if (typeof node.slice_type === 'string') {
		const sliceCtx = { slice: node.slice_type, path: [] };
		yield* fieldValues(node.primary, sliceCtx);
		yield* fieldValues(node.items, sliceCtx);
		return;
	}
	// Rich text block (type + text/spans): its parts belong to the field above
	const inText =
		ctx.inText || (typeof node.type === 'string' && ('text' in node || 'spans' in node));
	for (const [key, value] of Object.entries(node)) {
		if (key === 'schluessel') continue; // Token name of a variable is a definition
		const path = inText || key === 'slices' ? ctx.path : [...ctx.path, key];
		yield* fieldValues(value, { slice: ctx.slice, path, inText });
	}
}

/**
 * Readable field name «Inhalts-Element › Feld» from the field reference (labels as in Prismic)
 * @param {any[]} reference src/lib/generated/prismic-field-reference.json (may be empty)
 * @param {string} docType
 * @param {FieldCtx} ctx
 */
function fieldName(reference, docType, ctx) {
	const labelOf = (/** @type {string} */ key) =>
		reference.find((f) =>
			ctx.slice
				? f.sliceType === ctx.slice && f.field === key
				: f.customType === docType && f.field === key
		);
	const [first, second, ...rest] = ctx.path;
	const entry = first ? labelOf(first) : null;
	// Group field: label of the sub-field from the reference (subfields: key → label)
	const sub = second ? (entry?.subfields?.[second] ?? second) : undefined;
	const field = [entry?.label ?? first, sub, ...rest].filter(Boolean).join(' › ');
	if (!ctx.slice) return field;
	const sliceName = reference.find((f) => f.sliceType === ctx.slice)?.customTypeLabel ?? ctx.slice;
	return field ? `${sliceName} › ${field}` : sliceName;
}

/**
 * Readable title of a document (title / name / label field, otherwise uid)
 * @param {any} doc
 * @returns {string}
 */
function docTitle(doc) {
	const d = doc.data ?? {};
	for (const key of ['title', 'name', 'label', 'meta_title']) {
		const v = d[key];
		if (typeof v === 'string' && v.trim()) return v.trim();
		if (Array.isArray(v) && v[0]?.text) return v[0].text;
	}
	return doc.uid ?? doc.type;
}

/** @type {(doc: any) => DocRef} */
const ref = (doc) => ({
	id: doc.id,
	type: doc.type,
	uid: doc.uid ?? null,
	lang: doc.lang,
	title: docTitle(doc)
});

/**
 * @param {import('@prismicio/client').Client} client
 * @returns {Promise<{
 *   langs: string[];
 *   master: string;
 *   missing: { doc: DocRef; lacking: string[] }[];
 *   links: LinkProblem[];
 * }>}
 */
export async function checkContent(client, fieldReference = /** @type {any[]} */ ([])) {
	/** @param {any} doc @param {FieldCtx} ctx */
	const where = (doc, ctx) => fieldName(fieldReference, doc.type, ctx);
	const repo = await client.getRepository();
	const langs = repo.languages.map((l) => l.id);
	const master = repo.languages.find((l) => l.is_master)?.id ?? langs[0];

	const docs = await client.dangerouslyGetAll({ lang: '*' });
	const byId = new Map(docs.map((d) => [d.id, d]));

	// 1. Missing translations (only with more than one language)
	/** @type {{ doc: DocRef; lacking: string[] }[]} */
	const missing = [];
	if (langs.length > 1) {
		for (const doc of docs) {
			if (!TRANSLATED_TYPES.includes(doc.type) || doc.lang !== master) continue;
			const translated = new Set([doc.lang, ...doc.alternate_languages.map((a) => a.lang)]);
			const lacking = langs.filter((l) => !translated.has(l));
			if (lacking.length) missing.push({ doc: ref(doc), lacking });
		}
	}

	// 2. Link problems in all documents and languages
	/** @type {LinkProblem[]} */
	const links = [];
	for (const doc of docs) {
		for (const { value: link, ctx } of fieldValues(doc.data)) {
			if (typeof link !== 'object') continue;
			if (link.link_type === 'Web' && link.url && !ABSOLUTE_OR_SPECIAL.test(link.url)) {
				links.push({ doc: ref(doc), kind: 'relative', url: link.url, field: where(doc, ctx) });
			}
			if (link.link_type === 'Document' && doc.lang !== master && link.lang === master) {
				const translation = byId
					.get(link.id ?? '')
					?.alternate_languages?.find((a) => a.lang === doc.lang);
				if (translation) {
					links.push({
						doc: ref(doc),
						kind: 'untranslated_target',
						field: where(doc, ctx),
						target: `${link.type}/${link.uid} (${master})`,
						suggestion: `${translation.uid} (${doc.lang})`
					});
				}
			}
		}
	}

	// 3. «Kartenpunkt» fields that are not understood (address text, Google place without coordinates …)
	for (const doc of docs) {
		for (const { value, ctx } of fieldValues(doc.data)) {
			const key = ctx.path[ctx.path.length - 1];
			if (typeof value !== 'string' || !MAP_POINT_FIELDS.includes(key) || !value.trim()) continue;
			if (!parseMapPoint(value) && !isGoogleShortLink(value)) {
				links.push({ doc: ref(doc), kind: 'map_point', url: value.trim(), field: where(doc, ctx) });
			}
		}
	}

	// 4. Unknown tokens ({{…}} that neither the code nor a variable fills in)
	const known = new Set(CODE_TOKENS);
	for (const doc of docs) {
		if (doc.type !== 'variablen') continue;
		for (const entry of /** @type {any} */ (doc.data)?.eintraege ?? []) {
			if (entry?.schluessel?.trim()) known.add(tokenName(entry.schluessel));
		}
	}
	for (const doc of docs) {
		const reported = new Set();
		for (const { value: text, ctx } of fieldValues(doc.data)) {
			if (typeof text !== 'string') continue;
			for (const [, raw] of text.matchAll(TOKEN)) {
				const name = tokenName(raw);
				if (known.has(name) || reported.has(name)) continue;
				reported.add(name);
				const best = [...known]
					.map((k) => ({ k, d: distance(name, k) }))
					.sort((a, b) => a.d - b.d)[0];
				links.push({
					doc: ref(doc),
					kind: 'unknown_token',
					field: where(doc, ctx),
					token: `{{${raw}}}`,
					// Only close matches (typos), not unrelated short names
					suggestion: best && best.d <= 2 && best.d < name.length / 3 ? `{{${best.k}}}` : undefined
				});
			}
		}
	}

	// 5. Appointment booking: working days that cannot produce slots (offer without duration …).
	//    An ended series is normal and not reported here (only in the admin «Terminverwaltung»).
	const offers = docs.filter((d) => d.type === 'angebot' && d.lang === master);
	const today = new Date().toISOString().slice(0, 10);
	const workdays = docs.filter((d) => d.type === 'arbeitstag' && d.lang === master);
	for (const workday of workdays) {
		for (const problem of diagnoseArbeitstag(workday, offers, today)) {
			if (problem.key.startsWith('Die Serie ist abgelaufen')) continue;
			links.push({ doc: ref(workday), kind: 'termin', problem, field: terminField(problem.key) });
		}
	}
	// Offer without a current working day: «Buchen» in the Kacheln stays disabled
	for (const offer of offers) {
		for (const problem of diagnoseAngebot(offer, workdays, today)) {
			links.push({ doc: ref(offer), kind: 'termin', problem });
		}
	}

	// 6b. Legal pages (Impressum, Datenschutz): required entries of the settings, per language —
	//     each translation of the settings has its own fields, empty → «… fehlt» on the website
	const REQUIRED_LEGAL = [
		['responsible_person_company', 'Verantwortlich (Person/Unternehmen)'],
		['responsible_address', 'Verantwortliche Adresse'],
		['responsible_email', 'Verantwortliche E-Mail']
	];
	const filled = (/** @type {unknown} */ v) =>
		Array.isArray(v) ? v.some((b) => String(b?.text ?? '').trim()) : !!String(v ?? '').trim();
	for (const settings of docs.filter((d) => d.type === 'settings')) {
		const data = /** @type {any} */ (settings.data) ?? {};
		const missingFields = REQUIRED_LEGAL.filter(([key]) => !filled(data[key])).map(
			([, label]) => label
		);
		if (missingFields.length) {
			links.push({
				doc: ref(settings),
				kind: 'legal_missing',
				token: missingFields.join(', '),
				field: missingFields.join(', ')
			});
		}
	}

	// 6c. QR bill on invoices: IBAN + issuer address of the main-language settings
	//     (only when an invoicing feature is active, i.e. the settings have the field «IBAN»)
	const invoicing = fieldReference.some(
		(f) => f.customType === 'settings' && f.field === 'invoice_iban'
	);
	const invoiceSettings = docs.find((d) => d.type === 'settings' && d.lang === master);
	const invoiceData = /** @type {any} */ (invoiceSettings?.data) ?? {};
	if (invoicing && invoiceSettings && invoiceData.invoice_qr_bill !== false) {
		const lines = Array.isArray(invoiceData.responsible_address)
			? invoiceData.responsible_address.map((/** @type {any} */ b) => b?.text ?? '')
			: [];
		const currency = String(invoiceData.invoice_currency ?? 'CHF')
			.split(' - ')[0]
			.trim();
		for (const problem of qrBillProblems({
			iban: invoiceData.invoice_iban ?? '',
			creditor: parseAddress(invoiceData.responsible_person_company ?? '', lines),
			currency
		})) {
			links.push({
				doc: ref(invoiceSettings),
				kind: 'invoice_qr',
				token: problem,
				field: problem.startsWith('IBAN')
					? 'IBAN'
					: problem.startsWith('QR-Rechnung nur')
						? 'Grundwährung'
						: 'Verantwortliche Adresse'
			});
		}
	}

	// 6a. Slices without content (variation no longer in the Prismic model) — skipped on the website
	for (const doc of docs) {
		for (const slice of /** @type {any[]} */ (/** @type {any} */ (doc.data)?.slices ?? [])) {
			if (slice && (!slice.primary || !slice.variation)) {
				links.push({
					doc: ref(doc),
					kind: 'empty_slice',
					token: slice.slice_type,
					field: fieldName(fieldReference, doc.type, { slice: slice.slice_type, path: [] })
				});
			}
		}
	}

	// 6. Time sheet form (Formular «Stundenabrechnung») only works on password-protected pages
	for (const doc of docs) {
		if (doc.type !== 'page' || /** @type {any} */ (doc.data)?.password_protected === true) continue;
		const slices = /** @type {any[]} */ (/** @type {any} */ (doc.data)?.slices ?? []);
		if (slices.some((s) => s.slice_type === 'form' && s.variation === 'stunden')) {
			links.push({ doc: ref(doc), kind: 'stunden_unprotected', field: 'Passwortgeschützt' });
		}
	}

	// 7. Sender address of all e-mails (Settings → «Absender-E-Mail», main language)
	const mainSettings = docs.find((d) => d.type === 'settings' && d.lang === master);
	const mailFrom = String(/** @type {any} */ (mainSettings?.data)?.email_from_address ?? '').trim();
	if (mainSettings && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailFrom)) {
		links.push({
			doc: ref(mainSettings),
			kind: 'mail_from',
			url: mailFrom || undefined,
			field: 'Absender-E-Mail (alle E-Mails der Website)'
		});
	}

	return { langs, master, missing, links };
}
