/**
 * Why does a working day (Arbeitstag) produce no bookable slots? Used by the admin
 * «Terminverwaltung» (no free slots → hint) and the content check («Inhalte prüfen»).
 * Plain JS: also runs in scripts/check-translations.js.
 *
 * Each problem: { key, params } — `key` is an i18n key (translations.ts) with {placeholders}.
 */

/** @typedef {{ key: string; params?: Record<string, string | number> }} TerminProblem */

const minutes = (/** @type {string} */ value) => {
	const m = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
	return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const uidOf = (/** @type {any} */ link) => link?.uid ?? link?.id ?? '';

const STEP_DAYS = /** @type {Record<string, number>} */ ({
	Täglich: 1,
	Wöchentlich: 7,
	Zweiwöchentlich: 14
});

/** Last day of the series ('' = no end) */
function lastDay(/** @type {any} */ d) {
	const repeat = d.wiederholung ?? 'Keine';
	if (!repeat || repeat === 'Keine') return d.datum ?? '';
	// «Wiederholen bis (Datum)» has priority over «Anzahl Wiederholungen» (terminSlots.ts)
	if (d.wiederholung_bis) return d.wiederholung_bis;
	const count = Number(d.wiederholung_anzahl);
	if (!count || !d.datum) return '';
	const date = new Date(`${d.datum}T12:00:00Z`);
	if (repeat === 'Monatlich') date.setUTCMonth(date.getUTCMonth() + count - 1);
	else date.setUTCDate(date.getUTCDate() + (STEP_DAYS[repeat] ?? 0) * (count - 1));
	return date.toISOString().slice(0, 10);
}

/**
 * Problems of one working day (with its offers).
 * @param {any} workday Prismic document «arbeitstag»
 * @param {any[]} offers all documents «angebot»
 * @param {string} today YYYY-MM-DD
 * @returns {TerminProblem[]}
 */
export function diagnoseArbeitstag(workday, offers, today) {
	const d = workday?.data ?? {};
	/** @type {TerminProblem[]} */
	const problems = [];
	const start = minutes(d.startzeit);
	const end = minutes(d.endzeit);

	if (!d.datum) problems.push({ key: 'Datum fehlt' });
	if (start === null || end === null) {
		problems.push({ key: '«Startzeit» oder «Endzeit» fehlt oder ist nicht im Format HH:MM' });
	} else if (end <= start) {
		problems.push({ key: '«Endzeit» liegt nicht nach der «Startzeit»' });
	}

	const linked = (d.angebote ?? []).map((/** @type {any} */ e) => uidOf(e.angebot)).filter(Boolean);
	if (linked.length === 0) problems.push({ key: 'Kein «Buchbares Angebot» verknüpft' });

	for (const uid of linked) {
		const offer = offers.find((o) => o.uid === uid || o.id === uid);
		const title = offer?.data?.titel || uid;
		if (!offer) {
			problems.push({
				key: 'Angebot «{titel}» ist nicht veröffentlicht',
				params: { titel: title }
			});
			continue;
		}
		if (offer.data?.aktiv === false) {
			problems.push({ key: 'Angebot «{titel}» ist nicht aktiv', params: { titel: title } });
			continue;
		}
		const duration = Number(offer.data?.dauer ?? 0);
		const buffer = Math.max(0, Number(offer.data?.puffer_danach ?? 0));
		if (!(duration > 0)) {
			problems.push({
				key: 'Angebot «{titel}»: «Dauer (Minuten)» fehlt',
				params: { titel: title }
			});
		} else if (start !== null && end !== null && end > start && duration + buffer > end - start) {
			problems.push({
				key: 'Angebot «{titel}»: Dauer + Puffer ({minuten} Min.) passen nicht ins Zeitfenster',
				params: { titel: title, minuten: duration + buffer }
			});
		}
	}

	const last = lastDay(d);
	if (d.datum && last && last < today) {
		problems.push({
			key: 'Die Serie ist abgelaufen (letzter Tag {datum})',
			params: { datum: last }
		});
	}
	return problems;
}

/** Fills {placeholders} of a translated problem text */
export const formatProblem = (
	/** @type {string} */ text,
	/** @type {TerminProblem['params']} */ params
) => text.replace(/\{(\w+)\}/g, (_, k) => String(params?.[k] ?? `{${k}}`));

/**
 * Active offer that no current working day links → never any slots (Kacheln «Buchen» disabled).
 * @param {any} offer Prismic document «angebot»
 * @param {any[]} workdays all documents «arbeitstag»
 * @param {string} today YYYY-MM-DD
 * @returns {TerminProblem[]}
 */
export function diagnoseAngebot(offer, workdays, today) {
	if (offer?.data?.aktiv === false) return [];
	const linked = workdays.some((workday) => {
		const d = workday?.data ?? {};
		const last = lastDay(d);
		if (d.datum && last && last < today) return false;
		return (d.angebote ?? []).some((/** @type {any} */ e) =>
			[offer.uid, offer.id].includes(uidOf(e.angebot))
		);
	});
	if (linked) return [];
	return [
		{
			key: 'Angebot «{titel}» ist mit keinem aktuellen Arbeitstag verknüpft – keine Termine buchbar',
			params: { titel: offer?.data?.titel || offer?.uid || '' }
		}
	];
}
