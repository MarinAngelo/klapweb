/**
 * Field descriptions maintained by the agency (/agency/feldreferenz) for the Prismic field
 * reference that website operators see (/prismic-feldreferenz).
 *
 * Stored in src/lib/fieldDescriptions.json (committed on main → all branches):
 *   { "<custom type or Slice>.<field API-ID>": { "de-ch": "…", "en-us": "…" } }
 * One description per field, shared by all variations of a slice.
 * Without an entry the reference shows the automatic text from build-customtypes.js.
 */
import descriptions from './fieldDescriptions.json';

export type FieldDescriptions = Record<string, Record<string, string>>;

export const fieldDescriptions = descriptions as FieldDescriptions;

/** Key of a field: "ressource.whatsapp_tel", "Kontakt.app" */
export const fieldKey = (item: { customType: string; field: string }) =>
	`${item.customType}.${item.field}`;

/** Agency description in the language (fallback German), or null */
export function agencyDescription(
	item: { customType: string; field: string },
	lang: string
): string | null {
	const entry = fieldDescriptions[fieldKey(item)];
	if (!entry) return null;
	const base = lang.split('-')[0];
	const match = Object.keys(entry).find((l) => l.split('-')[0] === base);
	return (match && entry[match]?.trim()) || entry['de-ch']?.trim() || null;
}
