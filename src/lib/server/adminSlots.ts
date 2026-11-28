/**
 * Single free appointments entered in the admin («Terminverwaltung › Termin hinzufügen»),
 * as an alternative to an «Arbeitstag» in Prismic.
 *
 * Stored in the Blob store `termine_admin` and turned into pseudo working days, so they run
 * through the same logic as Prismic (expandArbeitstag: slot ids, booking, conflicts, reminder,
 * .ics). One entry = one slot per selected offer at the start time.
 */
import { getStore } from '@netlify/blobs';
import { env } from '$env/dynamic/private';
import { SITE_TIME_ZONE } from '$lib/utils/formatDate';

export interface AdminSlot {
	id: string;
	/** YYYY-MM-DD */
	datum: string;
	/** HH:MM */
	startzeit: string;
	/** UIDs of the offers («Angebot») */
	angebote: string[];
	zeitzone?: string;
	createdAt: string;
}

/** Prefix of the pseudo working day uid → slot ids `admin-<id>_<datum>_<angebot>_<zeit>` */
export const ADMIN_SLOT_PREFIX = 'admin-';

function store() {
	const siteID = env.NETLIFY_SITE_ID;
	const token = env.NETLIFY_TOKEN;
	if (!siteID || !token) throw new Error('Netlify Blobs: NETLIFY_SITE_ID / NETLIFY_TOKEN fehlt');
	return getStore({ name: 'termine_admin', siteID, token });
}

export async function listAdminSlots(): Promise<AdminSlot[]> {
	const s = store();
	const { blobs } = await s.list();
	const items = await Promise.all(
		blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<AdminSlot | null>)
	);
	return items.filter((x): x is AdminSlot => !!x);
}

export async function addAdminSlot(slot: Omit<AdminSlot, 'id' | 'createdAt'>): Promise<AdminSlot> {
	const record: AdminSlot = {
		...slot,
		id: `${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
		createdAt: new Date().toISOString()
	};
	await store().setJSON(record.id, record);
	return record;
}

export async function deleteAdminSlot(id: string): Promise<void> {
	await store().delete(id);
}

const toMinutes = (t: string) => {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m;
};
const toTime = (min: number) =>
	`${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Pseudo «Arbeitstag» documents for expandArbeitstag (window = exactly one slot per offer) */
export function adminSlotDocs(slots: AdminSlot[], offers: any[]): any[] {
	return slots.flatMap((slot) => {
		const start = toMinutes(slot.startzeit);
		const longest = Math.max(
			0,
			...offers
				.filter((o) => slot.angebote.includes(o.uid))
				.map((o) => Number(o.data?.dauer ?? 0) + Math.max(0, Number(o.data?.puffer_danach ?? 0)))
		);
		if (!longest || start + longest > 24 * 60) return [];
		return [
			{
				uid: `${ADMIN_SLOT_PREFIX}${slot.id}`,
				data: {
					bezeichnung: '',
					datum: slot.datum,
					startzeit: slot.startzeit,
					endzeit: toTime(start + longest),
					zeitzone: slot.zeitzone || SITE_TIME_ZONE,
					// Larger than the window → only the start time
					buchungsintervall: 24 * 60,
					angebote: slot.angebote.map((uid) => ({ angebot: { uid } })),
					wiederholung: 'Keine'
				}
			}
		];
	});
}

/** Working days from Prismic + single appointments from the admin (Blobs unreachable → only Prismic) */
export async function loadAllWorkdays(
	client: any
): Promise<{ workdays: any[]; offers: any[]; adminSlots: AdminSlot[] }> {
	const [prismicDays, offers, adminSlots] = await Promise.all([
		client.getAllByType('arbeitstag').catch(() => []),
		client.getAllByType('angebot').catch(() => []),
		listAdminSlots().catch(() => [] as AdminSlot[])
	]);
	return {
		workdays: [...prismicDays, ...adminSlotDocs(adminSlots, offers)],
		offers,
		adminSlots
	};
}
